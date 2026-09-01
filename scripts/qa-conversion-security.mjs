import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';
import { createHash, randomUUID } from 'node:crypto';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const prisma = new PrismaClient();
const baseUrl = (process.env.CONVERSION_QA_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET is required.');

const suffix = randomUUID().replaceAll('-', '');
let orderId = null;
let eventId = null;
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function claimToken(id) {
  return new SignJWT({ orderId: id, purpose: 'purchase-conversion' })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('10m')
    .sign(new TextEncoder().encode(jwtSecret));
}

try {
  const order = await prisma.order.create({
    data: {
      subtotal: 4200, discountAmount: 100, shippingCost: 221, total: 4321,
      paymentMethod: 'COD', paymentStatus: 'PENDING',
      shippingName: 'Conversion QA', shippingEmail: `conversion-qa-${suffix}@example.invalid`,
      shippingPhone: '03000000000', shippingAddress: 'QA address', shippingCity: 'Lahore',
      shippingRegion: 'Punjab', shippingPostalCode: '54000',
      items: [
        { id: 'qa-product-a', name: 'Authoritative A', price: 2000, quantity: 2 },
        { id: 'qa-product-b', name: 'Authoritative B', price: 200, quantity: 1 },
      ],
    },
  });
  orderId = order.id;
  eventId = `purchase_${createHash('sha256').update(order.id).digest('hex')}`;
  await prisma.marketingEvent.create({
    data: { id: eventId, eventName: 'Purchase', url: '/order-success', eventData: { orderId: order.id, value: 4321, currency: 'PKR', source: 'server-order-transaction' } },
  });

  const token = await claimToken(order.id);
  const forged = await fetch(`${baseUrl}/api/marketing/purchase`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: `${order.id}-forged`, token, value: 1 }),
  });
  assert(forged.status === 401, 'A claim token was accepted for a different order.');

  const first = await fetch(`${baseUrl}/api/marketing/purchase`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: order.id, token, value: 1, contentIds: ['forged'] }),
  });
  const firstPayload = await first.json();
  assert(first.status === 200 && firstPayload.shouldTrack === true, `First valid conversion claim was not accepted: HTTP ${first.status} ${JSON.stringify(firstPayload)}`);
  assert(firstPayload.data.value === 4321, 'Client-forged conversion value was trusted.');
  assert(firstPayload.data.numItems === 3, 'Authoritative item count was not derived from the order.');
  assert(firstPayload.data.contentIds.join(',') === 'qa-product-a,qa-product-b', 'Authoritative product IDs were not returned.');

  const second = await fetch(`${baseUrl}/api/marketing/purchase`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id, token }),
  });
  const secondPayload = await second.json();
  assert(second.status === 200 && secondPayload.shouldTrack === false, 'Duplicate conversion dispatch was allowed.');

  const generic = await fetch(`${baseUrl}/api/marketing/events`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName: 'Purchase', eventData: { value: 999999 } }),
  });
  assert(generic.status === 403, 'Generic marketing endpoint accepted a forged Purchase event.');
  assert(await prisma.marketingEvent.count({ where: { id: eventId } }) === 1, 'Purchase event deduplication failed.');

  console.log('[PASS] Signed claims bind conversion access to the correct order.');
  console.log('[PASS] Revenue, quantities and product IDs come from authoritative order data.');
  console.log('[PASS] Atomic dispatch and reserved-event protection prevent duplicate or forged purchases.');
} finally {
  if (eventId) await prisma.marketingEvent.deleteMany({ where: { id: eventId } }).catch(() => null);
  if (orderId) await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => null);
  await prisma.$disconnect();
}
