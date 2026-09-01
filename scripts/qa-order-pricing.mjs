import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();
const baseUrl = (process.env.ORDER_PRICING_QA_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

let productId = null;
let orderId = null;
const additionalOrderIds = [];
const idempotencyKeys = [];
let regionId = null;
let cityId = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeIdempotencyKey(label = 'order') {
  const key = `qa_${label}_${randomUUID().replaceAll('-', '_')}`;
  idempotencyKeys.push(key);
  return key;
}

try {
  const product = await prisma.product.create({
    data: {
      slug: `order-pricing-qa-${suffix}`,
      name: `Order Pricing QA ${suffix}`,
      description: 'Temporary product used to verify authoritative order pricing.',
      shortDescription: 'Temporary order-pricing fixture.',
      price: 4000,
      originalPrice: 4500,
      discount: 25,
      inStock: true,
      image: '/logo_main.png',
      variants: [{
        id: 'qa-black-42',
        color: 'Black',
        size: '42',
        stock: 6,
        imageUrl: '/variant-qa.png',
      }],
    },
  });
  productId = product.id;

  const region = await prisma.shippingRegion.create({
    data: { name: `Order Pricing QA Region ${suffix}`, shippingCost: 123 },
  });
  regionId = region.id;

  const city = await prisma.shippingCity.create({
    data: { name: `Order Pricing QA City ${suffix}`, regionId: region.id },
  });
  cityId = city.id;

  const orderPayload = (items, shippingOverrides = {}) => ({
    items,
    subtotal: 2,
    promoDiscount: 999999,
    shippingCost: 0,
    total: 1,
    shippingAddress: {
      fullName: 'Order Pricing QA',
      email: 'order-pricing-qa@example.invalid',
      phone: '03000000000',
      address: 'Temporary QA address',
      postalCode: '00000',
    },
    shippingMode: 'configured',
    shippingRegionId: region.id,
    shippingCityId: city.id,
    shippingRegion: 'FORGED REGION NAME',
    shippingCity: 'FORGED CITY NAME',
    paymentMethod: 'cod',
    ...shippingOverrides,
  });

  const missingKeyResponse = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload([{ id: product.id, quantity: 1, color: 'Black', size: '42' }])),
  });
  const missingKeyPayload = await missingKeyResponse.json();
  assert(missingKeyResponse.status === 400, `Missing key: expected HTTP 400, received ${missingKeyResponse.status}.`);
  assert(missingKeyPayload.code === 'IDEMPOTENCY_KEY_REQUIRED', 'Missing idempotency key was not rejected safely.');

  const expectRejected = async (label, items, expectedStatus, expectedCode) => {
    const rejectedResponse = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': makeIdempotencyKey('rejected'),
      },
      body: JSON.stringify(orderPayload(items)),
    });
    const rejectedPayload = await rejectedResponse.json();
    assert(
      rejectedResponse.status === expectedStatus,
      `${label}: expected HTTP ${expectedStatus}, received ${rejectedResponse.status}.`,
    );
    assert(
      rejectedPayload.code === expectedCode,
      `${label}: expected ${expectedCode}, received ${rejectedPayload.code}.`,
    );
  };

  const forgedReceiptResponse = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': makeIdempotencyKey('forged_receipt'),
    },
    body: JSON.stringify(orderPayload(
      [{ id: product.id, quantity: 1, color: 'Black', size: '42' }],
      { paymentMethod: 'direct', receiptUrl: 'https://attacker.invalid/fake-receipt.png' },
    )),
  });
  const forgedReceiptPayload = await forgedReceiptResponse.json();
  assert(forgedReceiptResponse.status === 400, 'An untrusted direct-payment receipt URL was accepted.');
  assert(forgedReceiptPayload.code === 'INVALID_RECEIPT', 'Forged receipt rejection returned the wrong code.');

  await expectRejected('Missing variant', [{ id: product.id, quantity: 1 }], 400, 'VARIANT_REQUIRED');
  await expectRejected(
    'Invalid quantity',
    [{ id: product.id, quantity: 1.5, color: 'Black', size: '42' }],
    400,
    'INVALID_ITEMS',
  );
  await expectRejected(
    'Invalid variant',
    [{ id: product.id, quantity: 1, color: 'Black', size: '99' }],
    409,
    'INVALID_VARIANT',
  );
  await expectRejected(
    'Insufficient stock',
    [{ id: product.id, quantity: 7, color: 'Black', size: '42' }],
    409,
    'INSUFFICIENT_STOCK',
  );
  await expectRejected(
    'Aggregate duplicate-line stock',
    [
      { id: product.id, quantity: 4, color: 'Black', size: '42' },
      { id: product.id, quantity: 3, color: 'black', size: '42' },
    ],
    409,
    'INSUFFICIENT_STOCK',
  );

  const inventoryBeforeOrder = await prisma.product.findUnique({ where: { id: product.id } });
  const variantBeforeOrder = Array.isArray(inventoryBeforeOrder?.variants)
    ? inventoryBeforeOrder.variants[0]
    : null;
  assert(variantBeforeOrder?.stock === 6, 'A rejected order changed variant stock.');

  const primaryOrderKey = makeIdempotencyKey('primary');
  const primaryOrderBody = JSON.stringify(orderPayload([{
    id: product.id,
    name: 'FORGED PRODUCT NAME',
    price: 1,
    quantity: 2,
    image: 'https://attacker.invalid/forged.png',
    color: 'black',
    size: '42',
  }]));
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': primaryOrderKey,
    },
    body: primaryOrderBody,
  });
  const payload = await response.json();
  assert(response.status === 201, `Expected HTTP 201, received ${response.status}: ${JSON.stringify(payload)}`);

  orderId = payload.data?.orderId || null;
  assert(orderId, 'Order ID was not returned.');
  assert(payload.data.subtotal === 6000, `Expected subtotal 6000, received ${payload.data.subtotal}.`);
  assert(payload.data.shippingCost === 123, `Expected shipping 123, received ${payload.data.shippingCost}.`);
  assert(payload.data.total === 6123, `Expected total 6123, received ${payload.data.total}.`);

  const storedOrder = await prisma.order.findUnique({ where: { id: orderId } });
  assert(storedOrder, 'Created order was not found in the database.');
  assert(storedOrder.subtotal === 6000, `Stored subtotal was ${storedOrder.subtotal}.`);
  assert(storedOrder.total === 6123, `Stored total was ${storedOrder.total}.`);
  assert(storedOrder.shippingRegion === region.name, 'Configured region name was not derived from the database.');
  assert(storedOrder.shippingCity === city.name, 'Configured city name was not derived from the database.');

  const storedItems = Array.isArray(storedOrder.items) ? storedOrder.items : [];
  const storedItem = storedItems[0];
  assert(storedItem?.name === product.name, 'Client product name reached the stored order.');
  assert(storedItem?.price === 3000, `Expected unit price 3000, received ${storedItem?.price}.`);
  assert(storedItem?.image === '/variant-qa.png', 'Authoritative variant image was not stored.');
  assert(storedItem?.variantId === 'qa-black-42', 'Authoritative variant ID was not stored.');
  assert(storedItem?.color === 'Black' && storedItem?.size === '42', 'Canonical variant was not stored.');

  const inventoryAfterOrder = await prisma.product.findUnique({ where: { id: product.id } });
  const variantAfterOrder = Array.isArray(inventoryAfterOrder?.variants)
    ? inventoryAfterOrder.variants[0]
    : null;
  assert(variantAfterOrder?.stock === 4, `Expected stock 4 after order, received ${variantAfterOrder?.stock}.`);
  assert(inventoryAfterOrder?.inStock === true, 'Product became unavailable while stock remained.');

  const replayResponse = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': primaryOrderKey,
    },
    body: primaryOrderBody,
  });
  const replayPayload = await replayResponse.json();
  assert(replayResponse.status === 200, `Expected replay HTTP 200, received ${replayResponse.status}.`);
  assert(replayPayload.replayed === true, 'Duplicate retry was not marked as a replay.');
  assert(replayPayload.data?.orderId === orderId, 'Duplicate retry did not return the original order.');

  const conflictingReplayResponse = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': primaryOrderKey,
    },
    body: JSON.stringify(orderPayload([
      { id: product.id, quantity: 1, color: 'Black', size: '42' },
    ])),
  });
  const conflictingReplayPayload = await conflictingReplayResponse.json();
  assert(conflictingReplayResponse.status === 409, 'Reusing a checkout key for a different request was accepted.');
  assert(conflictingReplayPayload.code === 'IDEMPOTENCY_KEY_REUSED', 'Key/body mismatch returned the wrong error code.');

  const inventoryAfterReplay = await prisma.product.findUnique({ where: { id: product.id } });
  const variantAfterReplay = Array.isArray(inventoryAfterReplay?.variants)
    ? inventoryAfterReplay.variants[0]
    : null;
  assert(variantAfterReplay?.stock === 4, 'A replayed order reduced stock again.');
  const storedPrimaryOrders = await prisma.order.count({
    where: { shippingEmail: 'order-pricing-qa@example.invalid' },
  });
  assert(storedPrimaryOrders === 1, `Expected one order after replay, found ${storedPrimaryOrders}.`);

  const invalidLocationResponse = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': makeIdempotencyKey('invalid_location'),
    },
    body: JSON.stringify(orderPayload([
      { id: product.id, quantity: 1, color: 'Black', size: '42' },
    ], {
      shippingCityId: 'missing-city-id',
    })),
  });
  const invalidLocationPayload = await invalidLocationResponse.json();
  assert(invalidLocationResponse.status === 400, 'An invalid configured city/region pair was accepted.');
  assert(invalidLocationPayload.code === 'INVALID_SHIPPING_LOCATION', 'Invalid shipping selection returned the wrong error code.');

  const manualCityResponse = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': makeIdempotencyKey('manual_city'),
    },
    body: JSON.stringify(orderPayload([
      { id: product.id, quantity: 1, color: 'Black', size: '42' },
    ], {
      shippingMode: 'manual',
      shippingRegionId: region.id,
      shippingCityId: null,
      shippingRegion: 'FORGED REGION NAME',
      shippingCity: 'Unlisted QA City',
    })),
  });
  const manualCityPayload = await manualCityResponse.json();
  assert(manualCityResponse.status === 201, `Manual city order failed: ${JSON.stringify(manualCityPayload)}.`);
  assert(manualCityPayload.data?.shippingCost === 123, 'Manual city did not use its configured regional rate.');
  const manualCityOrderId = manualCityPayload.data?.orderId;
  assert(manualCityOrderId, 'Manual city order did not return an ID.');
  additionalOrderIds.push(manualCityOrderId);
  const storedManualCityOrder = await prisma.order.findUnique({ where: { id: manualCityOrderId } });
  assert(storedManualCityOrder?.shippingRegion === region.name, 'Manual city order did not store the canonical configured region.');
  assert(storedManualCityOrder?.shippingCity === 'Unlisted QA City', 'Manual city order did not store the provided city.');

  const manualRegionResponse = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': makeIdempotencyKey('manual_region'),
    },
    body: JSON.stringify(orderPayload([
      { id: product.id, quantity: 1, color: 'Black', size: '42' },
    ], {
      shippingMode: 'manual',
      shippingRegionId: null,
      shippingCityId: null,
      shippingRegion: 'Remote QA Province',
      shippingCity: 'Remote QA City',
    })),
  });
  const manualRegionPayload = await manualRegionResponse.json();
  assert(manualRegionResponse.status === 201, `Manual region order failed: ${JSON.stringify(manualRegionPayload)}.`);
  assert(manualRegionPayload.data?.shippingCost === 350, 'Manual region did not use the backend fallback rate.');
  const manualRegionOrderId = manualRegionPayload.data?.orderId;
  assert(manualRegionOrderId, 'Manual region order did not return an ID.');
  additionalOrderIds.push(manualRegionOrderId);

  const inventoryAfterShippingFallbacks = await prisma.product.findUnique({ where: { id: product.id } });
  const variantAfterShippingFallbacks = Array.isArray(inventoryAfterShippingFallbacks?.variants)
    ? inventoryAfterShippingFallbacks.variants[0]
    : null;
  assert(variantAfterShippingFallbacks?.stock === 2, 'Shipping fallback tests changed stock unexpectedly.');

  const duplicateKey = makeIdempotencyKey('concurrent_duplicate');
  const duplicateBody = JSON.stringify(orderPayload([
    { id: product.id, quantity: 1, color: 'Black', size: '42' },
  ]));
  const duplicateResults = await Promise.all([1, 2].map(async () => {
    const duplicateResponse = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': duplicateKey,
      },
      body: duplicateBody,
    });
    return { status: duplicateResponse.status, payload: await duplicateResponse.json() };
  }));
  let duplicateSuccesses = duplicateResults.filter((result) => [200, 201].includes(result.status));
  if (duplicateSuccesses.length < 2) {
    const retryResponse = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': duplicateKey,
      },
      body: duplicateBody,
    });
    duplicateSuccesses = [...duplicateSuccesses, {
      status: retryResponse.status,
      payload: await retryResponse.json(),
    }].filter((result) => [200, 201].includes(result.status));
  }
  assert(duplicateSuccesses.length === 2, 'Concurrent duplicate requests did not resolve to one successful order and its replay.');
  const duplicateOrderIds = new Set(duplicateSuccesses.map((result) => result.payload.data?.orderId));
  assert(duplicateOrderIds.size === 1 && !duplicateOrderIds.has(undefined), 'Concurrent duplicates returned different orders.');
  additionalOrderIds.push([...duplicateOrderIds][0]);

  const inventoryAfterDuplicate = await prisma.product.findUnique({ where: { id: product.id } });
  const variantAfterDuplicate = Array.isArray(inventoryAfterDuplicate?.variants)
    ? inventoryAfterDuplicate.variants[0]
    : null;
  assert(variantAfterDuplicate?.stock === 1, 'Concurrent duplicate checkout reduced stock more than once.');

  const concurrentResults = await Promise.all([1, 2].map(async () => {
    const concurrentResponse = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': makeIdempotencyKey('stock_race'),
      },
      body: JSON.stringify(orderPayload([
        { id: product.id, quantity: 1, color: 'Black', size: '42' },
      ])),
    });
    return { status: concurrentResponse.status, payload: await concurrentResponse.json() };
  }));
  const concurrentSuccesses = concurrentResults.filter((result) => result.status === 201);
  const concurrentRejections = concurrentResults.filter((result) => result.status === 409);
  assert(concurrentSuccesses.length === 1, `Expected one concurrent order, received ${concurrentSuccesses.length}.`);
  assert(concurrentRejections.length === 1, `Expected one stock rejection, received ${concurrentRejections.length}.`);
  const concurrentOrderId = concurrentSuccesses[0].payload.data?.orderId;
  assert(concurrentOrderId, 'Concurrent successful order did not return an ID.');
  additionalOrderIds.push(concurrentOrderId);
  assert(
    ['OUT_OF_STOCK', 'INSUFFICIENT_STOCK', 'INVENTORY_CHANGED'].includes(concurrentRejections[0].payload.code),
    `Unexpected concurrent rejection code: ${concurrentRejections[0].payload.code}.`,
  );

  const exhaustedInventory = await prisma.product.findUnique({ where: { id: product.id } });
  const exhaustedVariant = Array.isArray(exhaustedInventory?.variants)
    ? exhaustedInventory.variants[0]
    : null;
  assert(exhaustedVariant?.stock === 0, `Expected exhausted stock 0, received ${exhaustedVariant?.stock}.`);
  assert(exhaustedInventory?.inStock === false, 'Product availability was not disabled at zero stock.');

  await expectRejected(
    'Unavailable product',
    [{ id: product.id, quantity: 1, color: 'Black', size: '42' }],
    409,
    'OUT_OF_STOCK',
  );

  console.log('[PASS] Product availability, variants, quantities and aggregate stock were validated.');
  console.log('[PASS] Stock reduction was atomic; only one concurrent order could buy the final unit.');
  console.log('[PASS] Duplicate retries returned the original order and reduced stock only once.');
  console.log('[PASS] Configured shipping IDs, regional manual cities, and manual-province fallback rates were enforced.');
  console.log('[PASS] Direct-payment orders accept only trusted uploaded receipt URLs.');

  const paymentResponse = await fetch(`${baseUrl}/api/payments/create-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 1 }),
  });
  assert(paymentResponse.status === 501, `Unsafe payment endpoint returned HTTP ${paymentResponse.status}.`);

  console.log('✓ Client price, product metadata and totals were ignored.');
  console.log('✓ Database pricing produced subtotal 6000 and configured shipping produced total 6123.');
  console.log('✓ Deferred card payment intent fails closed.');
} finally {
  const qaOrders = await prisma.order.findMany({
    where: { shippingEmail: 'order-pricing-qa@example.invalid' },
    select: { id: true },
  }).catch(() => []);
  if (qaOrders.length > 0) {
    await prisma.marketingEvent.deleteMany({
      where: { id: { in: qaOrders.map((order) => `purchase_${createHash('sha256').update(order.id).digest('hex')}`) } },
    }).catch(() => null);
  }
  if (idempotencyKeys.length > 0) {
    await prisma.orderIdempotency.deleteMany({ where: { key: { in: idempotencyKeys } } }).catch(() => null);
  }
  if (additionalOrderIds.length > 0) {
    await prisma.order.deleteMany({ where: { id: { in: additionalOrderIds } } }).catch(() => null);
  }
  if (orderId) await prisma.order.delete({ where: { id: orderId } }).catch(() => null);
  await prisma.order.deleteMany({
    where: { shippingEmail: 'order-pricing-qa@example.invalid' },
  }).catch(() => null);
  if (cityId) await prisma.shippingCity.delete({ where: { id: cityId } }).catch(() => null);
  if (regionId) await prisma.shippingRegion.delete({ where: { id: regionId } }).catch(() => null);
  if (productId) await prisma.product.delete({ where: { id: productId } }).catch(() => null);
  await prisma.$disconnect();
}
