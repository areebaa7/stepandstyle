import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { createHash, randomUUID } from 'node:crypto';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const baseUrl = (process.env.REVIEW_QA_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const suffix = randomUUID().replaceAll('-', '');
const userIds = [];
const productIds = [];
const orderIds = [];
const rateLimitKeys = new Set();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function limitKey(scope, identifier) {
  return `${scope}:${createHash('sha256').update(identifier.toLowerCase()).digest('hex')}`;
}

async function tokenFor(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));
}

async function request(path, { method = 'GET', token, body, ip = '198.51.100.10' } = {}) {
  const headers = { 'X-Forwarded-For': ip };
  if (token) headers.Cookie = `stepstyle_auth=${encodeURIComponent(token)}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { response, payload: await response.json() };
}

try {
  const password = await bcrypt.hash('ReviewQa123', 4);
  const verifiedUser = await prisma.user.create({
    data: {
      email: `review-verified-${suffix}@example.invalid`,
      name: 'Verified Review QA',
      password,
      role: 'USER',
      emailVerifiedAt: new Date(),
    },
  });
  const unverifiedUser = await prisma.user.create({
    data: {
      email: `review-unverified-${suffix}@example.invalid`,
      name: 'Unverified Review QA',
      password,
      role: 'USER',
    },
  });
  const spamUser = await prisma.user.create({
    data: {
      email: `review-spam-${suffix}@example.invalid`,
      name: 'Spam Review QA',
      password,
      role: 'USER',
      emailVerifiedAt: new Date(),
    },
  });
  userIds.push(verifiedUser.id, unverifiedUser.id, spamUser.id);

  const product = await prisma.product.create({
    data: {
      slug: `review-moderation-qa-${suffix}`,
      name: `Review Moderation QA ${suffix}`,
      description: 'Temporary moderation test product.',
      shortDescription: 'Temporary review fixture.',
      price: 1000,
      inStock: true,
      image: '/logo_main.png',
    },
  });
  productIds.push(product.id);

  const completedOrder = await prisma.order.create({
    data: {
      userId: verifiedUser.id,
      subtotal: 1000,
      discountAmount: 0,
      shippingCost: 0,
      total: 1000,
      status: 'COMPLETED',
      paymentMethod: 'COD',
      paymentStatus: 'APPROVED',
      shippingName: 'Review QA',
      shippingEmail: verifiedUser.email,
      shippingPhone: '03000000000',
      shippingAddress: 'Review QA address',
      shippingCity: 'Lahore',
      shippingRegion: 'Punjab',
      shippingPostalCode: '00000',
      items: [{ id: product.id, name: product.name, price: 1000, quantity: 1 }],
    },
  });
  orderIds.push(completedOrder.id);

  const [verifiedToken, unverifiedToken, spamToken, adminToken, nonAdminToken] = await Promise.all([
    tokenFor({ userId: verifiedUser.id, email: verifiedUser.email, role: 'USER', name: verifiedUser.name }),
    tokenFor({ userId: unverifiedUser.id, email: unverifiedUser.email, role: 'USER', name: unverifiedUser.name }),
    tokenFor({ userId: spamUser.id, email: spamUser.email, role: 'USER', name: spamUser.name }),
    tokenFor({ userId: `review-admin-${suffix}`, email: `review-admin-${suffix}@example.invalid`, role: 'ADMIN', name: 'Review Admin QA' }),
    tokenFor({ userId: unverifiedUser.id, email: unverifiedUser.email, role: 'USER', name: unverifiedUser.name }),
  ]);
  const path = `/api/products/${product.slug}/reviews`;
  const validBody = {
    rating: 4,
    comment: 'These shoes were comfortable and matched the product description.',
    images: ['https://images.example.com/review.jpg'],
    videoUrl: 'https://youtu.be/reviewQaVideo',
  };

  const guest = await request(path, { method: 'POST', body: validBody });
  assert(guest.response.status === 401 && guest.payload.code === 'CUSTOMER_AUTH_REQUIRED', 'Guest review submission was not blocked.');
  const unverified = await request(path, { method: 'POST', token: unverifiedToken, body: validBody, ip: '198.51.100.11' });
  assert(unverified.response.status === 403 && unverified.payload.code === 'EMAIL_VERIFICATION_REQUIRED', 'Unverified customer review was not blocked.');

  const mainIp = '198.51.100.12';
  rateLimitKeys.add(limitKey('review-ip', mainIp));
  rateLimitKeys.add(limitKey('review-user', verifiedUser.id));
  const invalidRating = await request(path, { method: 'POST', token: verifiedToken, body: { ...validBody, rating: 6 }, ip: mainIp });
  assert(invalidRating.response.status === 400, 'Out-of-range review rating was accepted.');
  const invalidComment = await request(path, { method: 'POST', token: verifiedToken, body: { ...validBody, comment: 'Too short' }, ip: mainIp });
  assert(invalidComment.response.status === 400, 'Short review comment was accepted.');
  const invalidMedia = await request(path, { method: 'POST', token: verifiedToken, body: { ...validBody, images: ['http://unsafe.example/review.jpg'] }, ip: mainIp });
  assert(invalidMedia.response.status === 400, 'Unsafe review media URL was accepted.');
  await prisma.authRateLimit.deleteMany({ where: { key: { in: [...rateLimitKeys] } } });

  const submitted = await request(path, { method: 'POST', token: verifiedToken, body: validBody, ip: mainIp });
  assert(submitted.response.status === 202 && submitted.payload.pendingModeration, `Valid review was not queued: ${JSON.stringify(submitted.payload)}.`);
  const reviewId = submitted.payload.review?.id;
  assert(reviewId, 'Pending review ID was not returned.');
  const pending = await prisma.review.findUnique({ where: { id: reviewId } });
  assert(pending?.status === 'PENDING' && pending.isVerifiedPurchase === true, 'Pending/verified-purchase state was not stored.');

  const publicPending = await request(path);
  assert(publicPending.payload.reviews.length === 0, 'Pending review leaked through the product API.');
  const publicGlobal = await request('/api/reviews');
  assert(publicGlobal.payload.reviews.every((review) => !('userEmail' in review)), 'Public review API exposed customer email.');

  const duplicate = await request(path, { method: 'POST', token: verifiedToken, body: validBody, ip: mainIp });
  assert(duplicate.response.status === 409 && duplicate.payload.code === 'REVIEW_ALREADY_SUBMITTED', 'Duplicate customer/product review was accepted.');
  const nonAdminModeration = await request('/api/admin/reviews', { method: 'PATCH', token: nonAdminToken, body: { id: reviewId, status: 'APPROVED' } });
  assert([401, 403].includes(nonAdminModeration.response.status), 'Non-admin review moderation was accepted.');

  const missingReason = await request('/api/admin/reviews', { method: 'PATCH', token: adminToken, body: { id: reviewId, status: 'REJECTED' } });
  assert(missingReason.response.status === 400, 'Review rejection without a reason was accepted.');
  const approved = await request('/api/admin/reviews', { method: 'PATCH', token: adminToken, body: { id: reviewId, status: 'APPROVED' } });
  assert(approved.response.status === 200 && approved.payload.data.status === 'APPROVED', 'Admin could not approve review.');
  const approvedProduct = await prisma.product.findUnique({ where: { id: product.id } });
  assert(approvedProduct?.rating === 4, `Approved-only product rating was ${approvedProduct?.rating}.`);
  const publicApproved = await request(path);
  assert(publicApproved.payload.reviews.length === 1 && !('userEmail' in publicApproved.payload.reviews[0]), 'Approved review visibility/privacy failed.');

  const featured = await request('/api/admin/reviews', { method: 'PATCH', token: adminToken, body: { id: reviewId, isFeatured: true } });
  assert(featured.response.status === 200 && featured.payload.data.isFeatured, 'Admin could not feature approved review.');
  const featuredPublic = await request('/api/reviews/featured');
  assert(featuredPublic.payload.reviews.some((review) => review.id === reviewId), 'Featured review did not reach curated public API.');

  const rejected = await request('/api/admin/reviews', { method: 'PATCH', token: adminToken, body: { id: reviewId, status: 'REJECTED', moderationNote: 'Contains unsupported claims.' } });
  assert(rejected.response.status === 200 && rejected.payload.data.status === 'REJECTED' && !rejected.payload.data.isFeatured, 'Admin rejection did not remove featured state.');
  assert((await request(path)).payload.reviews.length === 0, 'Rejected review remained public.');
  assert((await prisma.product.findUnique({ where: { id: product.id } }))?.rating === 0, 'Product rating was not recalculated after rejection.');

  const resubmitted = await request(path, { method: 'POST', token: verifiedToken, body: { ...validBody, comment: 'Updated review with accurate details after admin feedback.' }, ip: mainIp });
  assert(resubmitted.response.status === 202 && resubmitted.payload.review.id === reviewId, 'Rejected review could not be safely revised and resubmitted.');
  await request('/api/admin/reviews', { method: 'PATCH', token: adminToken, body: { id: reviewId, status: 'APPROVED' } });
  const deleted = await request(`/api/admin/reviews?id=${encodeURIComponent(reviewId)}`, { method: 'DELETE', token: adminToken });
  assert(deleted.response.status === 200, 'Admin could not delete review.');
  assert((await prisma.product.findUnique({ where: { id: product.id } }))?.rating === 0, 'Product rating was not recalculated after review deletion.');

  const spamIp = '198.51.100.13';
  rateLimitKeys.add(limitKey('review-ip', spamIp));
  rateLimitKeys.add(limitKey('review-user', spamUser.id));
  const spamResults = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    spamResults.push(await request(path, { method: 'POST', token: spamToken, body: validBody, ip: spamIp }));
  }
  assert(spamResults[0].response.status === 202, 'First spam-protection fixture submission failed unexpectedly.');
  assert(spamResults.slice(1, 5).every(({ response }) => response.status === 409), 'Duplicate protection failed before rate limit.');
  assert(spamResults[5].response.status === 429 && spamResults[5].payload.code === 'REVIEW_RATE_LIMITED', 'Review user rate limit did not block the sixth attempt.');
  assert(Number(spamResults[5].response.headers.get('retry-after')) > 0, 'Review rate limit omitted Retry-After.');

  console.log('[PASS] Review submissions require verified customer authentication and strict server validation.');
  console.log('[PASS] Pending/rejected reviews stay private; approval, featuring, deletion and rating recalculation work.');
  console.log('[PASS] Duplicate and user/IP rate protections block review spam without exposing customer email.');
} finally {
  if (productIds.length > 0) await prisma.review.deleteMany({ where: { productId: { in: productIds } } }).catch(() => null);
  if (orderIds.length > 0) await prisma.order.deleteMany({ where: { id: { in: orderIds } } }).catch(() => null);
  if (productIds.length > 0) await prisma.product.deleteMany({ where: { id: { in: productIds } } }).catch(() => null);
  if (rateLimitKeys.size > 0) await prisma.authRateLimit.deleteMany({ where: { key: { in: [...rateLimitKeys] } } }).catch(() => null);
  if (userIds.length > 0) await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => null);
  await prisma.$disconnect();
}
