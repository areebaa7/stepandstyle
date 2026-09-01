import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const baseUrl = (process.env.AUTH_RATE_LIMIT_QA_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const suffix = randomUUID().replaceAll('-', '');
const email = `auth-rate-qa-${suffix}@example.invalid`;
const password = 'QaPassword123';
const cleanupKeys = new Set();
let userId = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function trackKey(scope, identifier) {
  const normalized = identifier.trim().toLowerCase();
  cleanupKeys.add(`${scope}:${createHash('sha256').update(normalized).digest('hex')}`);
}

async function post(path, body, ip) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': ip,
    },
    body: JSON.stringify(body),
  });
  return { response, payload: await response.json() };
}

try {
  const user = await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 4),
      name: 'Auth Rate Limit QA',
      role: 'USER',
      emailVerifiedAt: new Date(),
    },
  });
  userId = user.id;

  const resetIp = `198.51.100.${Number.parseInt(suffix.slice(0, 2), 16) % 200 + 1}`;
  trackKey('login-ip', resetIp);
  trackKey('login-email', email);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const wrong = await post('/api/auth/login', { email, password: 'WrongPassword123' }, resetIp);
    assert(wrong.response.status === 401, `Pre-reset login attempt returned HTTP ${wrong.response.status}.`);
  }

  const successful = await post('/api/auth/login', { email: `  ${email.toUpperCase()}  `, password }, resetIp);
  assert(successful.response.status === 200 && successful.payload.success, 'Valid login failed before reset verification.');
  assert(successful.response.headers.get('set-cookie')?.includes('stepstyle_auth='), 'Valid login did not set the auth cookie.');

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const wrong = await post('/api/auth/login', { email, password: 'WrongPassword123' }, resetIp);
    assert(wrong.response.status === 401, `Post-reset attempt ${attempt + 1} was limited too early.`);
  }
  const blockedAfterReset = await post('/api/auth/login', { email, password: 'WrongPassword123' }, resetIp);
  assert(blockedAfterReset.response.status === 429, 'Sixth failed login was not rate limited.');
  assert(blockedAfterReset.payload.code === 'AUTH_RATE_LIMITED', 'Login rate limit returned the wrong error code.');
  assert(Number(blockedAfterReset.response.headers.get('retry-after')) > 0, 'Login rate limit omitted Retry-After.');
  assert(blockedAfterReset.response.headers.get('ratelimit-remaining') === '0', 'Login limit did not report zero remaining attempts.');

  const concurrentEmail = `missing-${suffix}@example.invalid`;
  const concurrentIp = `203.0.113.${Number.parseInt(suffix.slice(2, 4), 16) % 200 + 1}`;
  trackKey('login-ip', concurrentIp);
  trackKey('login-email', concurrentEmail);
  const concurrentLogins = await Promise.all(
    Array.from({ length: 8 }, () => post(
      '/api/auth/login',
      { email: concurrentEmail, password: 'WrongPassword123' },
      concurrentIp,
    )),
  );
  assert(concurrentLogins.filter(({ response }) => response.status === 401).length === 5, 'Concurrent login limiter allowed the wrong number of attempts.');
  assert(concurrentLogins.filter(({ response }) => response.status === 429).length === 3, 'Concurrent login limiter did not atomically block excess attempts.');

  const registrationIp = `192.0.2.${Number.parseInt(suffix.slice(4, 6), 16) % 200 + 1}`;
  trackKey('register-ip', registrationIp);
  trackKey('register-email', email);
  const registrationBody = { email, password, name: 'Duplicate QA User' };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const duplicate = await post('/api/auth', registrationBody, registrationIp);
    assert(duplicate.response.status === 409, `Registration email attempt ${attempt + 1} was limited too early.`);
  }
  const blockedRegistration = await post('/api/auth', registrationBody, registrationIp);
  assert(blockedRegistration.response.status === 429, 'Fourth same-email registration attempt was not limited.');
  assert(blockedRegistration.payload.code === 'AUTH_RATE_LIMITED', 'Registration rate limit returned the wrong error code.');

  const registrationFloodIp = `192.0.2.${Number.parseInt(suffix.slice(6, 8), 16) % 200 + 1}`;
  trackKey('register-ip', registrationFloodIp);
  const registrationFlood = await Promise.all(Array.from({ length: 25 }, (_, index) => {
    const invalidEmail = `invalid-${suffix}-${index}`;
    trackKey('register-email', invalidEmail);
    return post('/api/auth', { email: invalidEmail, password, name: 'Flood QA' }, registrationFloodIp);
  }));
  assert(registrationFlood.filter(({ response }) => response.status === 400).length === 20, 'Registration IP limiter allowed the wrong number of attempts.');
  assert(registrationFlood.filter(({ response }) => response.status === 429).length === 5, 'Registration IP limiter did not atomically block excess attempts.');

  console.log('[PASS] Successful login reset the account failure bucket.');
  console.log('[PASS] Login email limits atomically allowed 5 attempts and blocked excess requests.');
  console.log('[PASS] Registration email and IP limits returned safe HTTP 429 responses with rate-limit headers.');
} finally {
  if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => null);
  if (cleanupKeys.size > 0) {
    await prisma.authRateLimit.deleteMany({ where: { key: { in: [...cleanupKeys] } } }).catch(() => null);
  }
  await prisma.$disconnect();
}
