import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';
import { createHash, randomUUID } from 'node:crypto';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const baseUrl = (process.env.UPLOAD_QA_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET is required to run upload QA.');

const suffix = randomUUID().replaceAll('-', '');
const adminId = `upload-qa-admin-${suffix}`;
const adminIp = `198.51.100.${Number.parseInt(suffix.slice(0, 2), 16) % 200 + 1}`;
const receiptIp = `203.0.113.${Number.parseInt(suffix.slice(2, 4), 16) % 200 + 1}`;
const limitIp = `192.0.2.${Number.parseInt(suffix.slice(4, 6), 16) % 200 + 1}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function token(role, userId) {
  return new SignJWT({ userId, email: `${userId}@example.invalid`, role, name: 'Upload QA' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(new TextEncoder().encode(jwtSecret));
}

const adminToken = await token('ADMIN', adminId);
const userToken = await token('USER', `upload-qa-user-${suffix}`);

async function upload(path, { authToken, ip, files = [], field = 'files' } = {}) {
  const form = new FormData();
  files.forEach((file) => form.append(field, file));
  const headers = { 'X-Forwarded-For': ip || receiptIp };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: form });
  return { response, payload: await response.json() };
}

const fakePng = new File([new TextEncoder().encode('not a png')], 'receipt.png', { type: 'image/png' });
const svg = new File([new TextEncoder().encode('<svg><script>alert(1)</script></svg>')], 'attack.svg', { type: 'image/svg+xml' });
const pngHeader = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

try {
  const guest = await upload('/api/uploads/media', { ip: adminIp, files: [fakePng] });
  assert(guest.response.status === 403, `Guest admin upload returned ${guest.response.status}.`);
  const nonAdmin = await upload('/api/uploads/media', { authToken: userToken, ip: adminIp, files: [fakePng] });
  assert(nonAdmin.response.status === 403, `Non-admin upload returned ${nonAdmin.response.status}.`);

  const missing = await upload('/api/uploads/media', { authToken: adminToken, ip: adminIp });
  assert(missing.response.status === 400, 'Empty admin upload was accepted.');
  const tooMany = await upload('/api/uploads/media', {
    authToken: adminToken,
    ip: adminIp,
    files: Array.from({ length: 11 }, (_, index) => new File(['x'], `file-${index}.jpg`, { type: 'image/jpeg' })),
  });
  assert(tooMany.response.status === 400 && tooMany.payload.code === 'TOO_MANY_FILES', 'Admin batch file-count limit failed.');
  const svgResult = await upload('/api/uploads/media', { authToken: adminToken, ip: adminIp, files: [svg] });
  assert(svgResult.response.status === 415, 'SVG upload was accepted.');
  const spoofed = await upload('/api/uploads/media', { authToken: adminToken, ip: adminIp, files: [fakePng] });
  assert(spoofed.response.status === 415 && spoofed.payload.code === 'FILE_SIGNATURE_MISMATCH', 'MIME-spoofed image was accepted.');
  const wrongExtension = new File([pngHeader], 'image.txt', { type: 'image/png' });
  const extensionResult = await upload('/api/uploads/media', { authToken: adminToken, ip: adminIp, files: [wrongExtension] });
  assert(extensionResult.response.status === 415 && extensionResult.payload.code === 'INVALID_FILE_EXTENSION', 'Extension mismatch was accepted.');

  const receiptSvg = await upload('/api/uploads/receipt', { ip: receiptIp, files: [svg], field: 'file' });
  assert(receiptSvg.response.status === 415, 'SVG receipt was accepted.');
  const receiptSpoof = await upload('/api/uploads/receipt', { ip: receiptIp, files: [fakePng], field: 'file' });
  assert(receiptSpoof.response.status === 415, 'Spoofed receipt was accepted.');
  const oversizedBytes = new Uint8Array(5 * 1024 * 1024 + 1);
  oversizedBytes.set(pngHeader);
  const oversized = await upload('/api/uploads/receipt', {
    ip: receiptIp,
    files: [new File([oversizedBytes], 'large.png', { type: 'image/png' })],
    field: 'file',
  });
  assert(oversized.response.status === 413 && oversized.payload.code === 'FILE_TOO_LARGE', 'Oversized receipt was accepted.');

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const allowed = await upload('/api/uploads/receipt', { ip: limitIp });
    assert(allowed.response.status === 400, `Receipt rate limit blocked attempt ${attempt + 1} too early.`);
  }
  const blocked = await upload('/api/uploads/receipt', { ip: limitIp });
  assert(blocked.response.status === 429 && blocked.payload.code === 'UPLOAD_RATE_LIMITED', 'Receipt upload rate limit did not block attempt 11.');
  assert(Number(blocked.response.headers.get('retry-after')) > 0, 'Receipt limiter omitted Retry-After.');

  console.log('[PASS] Admin uploads require authorization and enforce file-count limits.');
  console.log('[PASS] SVG, MIME spoofing, extension mismatch and oversized receipts are rejected before storage.');
  console.log('[PASS] Receipt upload abuse is rate limited with retry guidance.');
} finally {
  const keys = [
    `upload-admin:${createHash('sha256').update(`${adminId}:${adminIp}`).digest('hex')}`,
    `upload-receipt:${createHash('sha256').update(receiptIp).digest('hex')}`,
    `upload-receipt:${createHash('sha256').update(limitIp).digest('hex')}`,
  ];
  await prisma.authRateLimit.deleteMany({ where: { key: { in: keys } } }).catch(() => null);
  await prisma.$disconnect();
}
