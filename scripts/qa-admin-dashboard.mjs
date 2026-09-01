import { readFile } from 'node:fs/promises';
import nextEnv from '@next/env';
import { SignJWT } from 'jose';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const baseUrl = (process.env.ADMIN_QA_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is required to run admin QA.');
}

const results = [];

function pass(name, detail = '') {
  results.push({ ok: true, name, detail });
}

function fail(name, detail) {
  results.push({ ok: false, name, detail });
}

async function makeToken(role) {
  return new SignJWT({
    userId: `admin-qa-${role.toLowerCase()}`,
    email: `${role.toLowerCase()}-admin-qa@example.invalid`,
    role,
    name: `Admin QA ${role}`,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(new TextEncoder().encode(jwtSecret));
}

const adminToken = await makeToken('ADMIN');
const userToken = await makeToken('USER');

function authHeaders(token, extra = {}) {
  return {
    Authorization: `Bearer ${token}`,
    Cookie: `stepstyle_auth=${encodeURIComponent(token)}`,
    ...extra,
  };
}

async function request(path, { role, method = 'GET', body } = {}) {
  const token = role === 'ADMIN' ? adminToken : role === 'USER' ? userToken : null;
  const headers = token ? authHeaders(token) : {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  });
}

async function expectStatus(name, path, options, acceptedStatuses) {
  try {
    const response = await request(path, options);
    if (acceptedStatuses.includes(response.status)) {
      pass(name, `HTTP ${response.status}`);
    } else {
      const payload = await response.text();
      fail(name, `Expected ${acceptedStatuses.join('/')}, received ${response.status}: ${payload.slice(0, 160)}`);
    }
  } catch (error) {
    fail(name, error instanceof Error ? error.message : String(error));
  }
}

try {
  const health = await fetch(`${baseUrl}/api/products`, { redirect: 'manual' });
  if (!health.ok) throw new Error(`Server returned HTTP ${health.status}.`);
  pass('Local application is reachable', baseUrl);
} catch (error) {
  console.error(`Admin QA could not reach ${baseUrl}. Start the development server or set ADMIN_QA_BASE_URL.`);
  throw error;
}

const protectedReads = [
  ['Analytics', '/api/admin/analytics?range=6m'],
  ['Analytics traffic', '/api/admin/analytics/traffic?days=7'],
  ['Blogs', '/api/admin/blogs'],
  ['Customers', '/api/admin/customers'],
  ['Inventory', '/api/admin/inventory'],
  ['Marketing events', '/api/admin/marketing/events'],
  ['Marketing settings', '/api/admin/settings/marketing'],
  ['Newsletter settings', '/api/admin/newsletter/settings'],
  ['Newsletter subscribers', '/api/admin/newsletter/subscribers'],
  ['Reviews', '/api/admin/reviews'],
  ['Sale events', '/api/admin/sales'],
  ['Storefront settings', '/api/admin/settings/storefront'],
  ['Email and cron status', '/api/admin/system-status'],
  ['Affiliate applications', '/api/affiliate/applications'],
  ['Banners management', '/api/banners'],
  ['Influencers', '/api/influencers'],
  ['Orders management', '/api/orders?scope=all'],
  ['Promo codes', '/api/promo-codes'],
  ['Promo users', '/api/promo-users'],
  ['Reels management', '/api/reels'],
];

for (const [label, path] of protectedReads) {
  await expectStatus(`${label}: guest blocked`, path, {}, [401, 403]);
  await expectStatus(`${label}: non-admin blocked`, path, { role: 'USER' }, [401, 403]);
  await expectStatus(`${label}: admin allowed`, path, { role: 'ADMIN' }, [200]);
}

const protectedReadBoundaries = [
  ['Customer detail', '/api/admin/customers/admin-qa-invalid'],
  ['Promo-user detail', '/api/promo-users/admin-qa-invalid'],
];

for (const [label, path] of protectedReadBoundaries) {
  await expectStatus(`${label}: guest blocked`, path, {}, [401, 403]);
  await expectStatus(`${label}: non-admin blocked`, path, { role: 'USER' }, [401, 403]);
}

const publicReads = [
  ['Public products', '/api/products'],
  ['Public collections', '/api/collections'],
  ['Public shipping rates', '/api/shipping'],
  ['Public storefront settings', '/api/storefront-settings'],
  ['Published banners', '/api/banners?isActive=true'],
  ['Published reels', '/api/reels?isActive=true'],
];

for (const [label, path] of publicReads) {
  await expectStatus(`${label}: guest allowed`, path, {}, [200]);
}

const protectedMutations = [
  ['Create product', '/api/products', 'POST', {}],
  ['Update product', '/api/products/admin-qa-invalid', 'PUT', {}],
  ['Delete product', '/api/products/admin-qa-invalid', 'DELETE'],
  ['Create collection', '/api/collections', 'POST', {}],
  ['Update collection', '/api/collections/admin-qa-invalid', 'PATCH', {}],
  ['Delete collection', '/api/collections/admin-qa-invalid', 'DELETE'],
  ['Create banner', '/api/banners', 'POST', {}],
  ['Update banner', '/api/banners/admin-qa-invalid', 'PUT', {}],
  ['Delete banner', '/api/banners/admin-qa-invalid', 'DELETE'],
  ['Create shipping region', '/api/shipping', 'POST', {}],
  ['Create shipping city', '/api/shipping/admin-qa-invalid', 'POST', {}],
  ['Update shipping rate', '/api/shipping/admin-qa-invalid', 'PUT', {}],
  ['Delete shipping region', '/api/shipping/admin-qa-invalid', 'DELETE'],
  ['Update order', '/api/orders/admin-qa-invalid', 'PUT', {}],
  ['Create promo code', '/api/promo-codes', 'POST', {}],
  ['Create influencer', '/api/influencers', 'POST', {}],
  ['Create promo user', '/api/promo-users', 'POST', {}],
  ['Update promo user', '/api/promo-users/admin-qa-invalid', 'PUT', {}],
  ['Delete promo user', '/api/promo-users/admin-qa-invalid', 'DELETE'],
  ['Approve affiliate', '/api/affiliate/applications/admin-qa-invalid/approve', 'POST', {}],
  ['Reject affiliate', '/api/affiliate/applications/admin-qa-invalid/reject', 'POST', {}],
  ['Delete review', '/api/admin/reviews?id=admin-qa-invalid', 'DELETE'],
  ['Moderate review', '/api/admin/reviews', 'PATCH', { id: 'admin-qa-invalid', status: 'APPROVED' }],
  ['Save marketing settings', '/api/admin/settings/marketing', 'POST', {}],
  ['Save newsletter settings', '/api/admin/newsletter/settings', 'POST', {}],
  ['Update newsletter subscriber', '/api/admin/newsletter/subscribers', 'PATCH', {}],
  ['Create sale event', '/api/admin/sales', 'POST', {}],
  ['Update sale event', '/api/admin/sales/admin-qa-invalid', 'PATCH', {}],
  ['Delete sale event', '/api/admin/sales/admin-qa-invalid', 'DELETE'],
  ['Create reel', '/api/reels', 'POST', {}],
  ['Update reel', '/api/reels/admin-qa-invalid', 'PUT', {}],
  ['Delete reel', '/api/reels/admin-qa-invalid', 'DELETE'],
  ['Save storefront settings', '/api/admin/settings/storefront', 'POST', {}],
  ['Update inventory', '/api/admin/inventory', 'PATCH', {}],
  ['Create blog', '/api/admin/blogs', 'POST', {}],
  ['Update blog', '/api/admin/blogs/admin-qa-invalid', 'PUT', {}],
  ['Delete blog', '/api/admin/blogs/admin-qa-invalid', 'DELETE'],
  ['Upload blog image', '/api/admin/blogs/upload', 'POST'],
  ['Perform customer action', '/api/admin/customers/admin-qa-invalid', 'POST', {}],
  ['Upload admin media', '/api/uploads/media', 'POST'],
];

for (const [label, path, method, body] of protectedMutations) {
  await expectStatus(`${label}: guest blocked`, path, { method, body }, [401, 403]);
  await expectStatus(`${label}: non-admin blocked`, path, { role: 'USER', method, body }, [401, 403]);
}

const safeValidationChecks = [
  ['Shipping form rejects missing region name', '/api/shipping', 'POST', [400]],
  ['Collection form rejects missing fields', '/api/collections', 'POST', [400]],
  ['Banner form rejects missing fields', '/api/banners', 'POST', [400]],
  ['Reel form rejects missing fields', '/api/reels', 'POST', [400]],
  ['Influencer form rejects missing fields', '/api/influencers', 'POST', [400]],
  ['Newsletter settings reject incomplete consent', '/api/admin/newsletter/settings', 'POST', [400]],
  ['Inventory update rejects missing product', '/api/admin/inventory', 'PATCH', [400]],
  ['Blog form rejects missing fields', '/api/admin/blogs', 'POST', [400]],
];

for (const [label, path, method, statuses] of safeValidationChecks) {
  await expectStatus(label, path, { role: 'ADMIN', method, body: {} }, statuses);
}

await expectStatus(
  'Storefront settings reject an invalid manual-payment flag',
  '/api/admin/settings/storefront',
  { role: 'ADMIN', method: 'POST', body: { manualPaymentEnabled: 'yes' } },
  [400],
);
await expectStatus(
  'Storefront settings reject oversized payment instructions',
  '/api/admin/settings/storefront',
  { role: 'ADMIN', method: 'POST', body: { manualPaymentInstructions: 'x'.repeat(501) } },
  [400],
);
await expectStatus(
  'Business settings reject an invalid support email',
  '/api/admin/settings/storefront',
  { role: 'ADMIN', method: 'POST', body: { supportEmail: 'not-an-email' } },
  [400],
);
await expectStatus(
  'Business settings reject a mismatched social URL',
  '/api/admin/settings/storefront',
  { role: 'ADMIN', method: 'POST', body: { whatsappUrl: 'https://example.com/not-whatsapp' } },
  [400],
);
await expectStatus(
  'Policy settings reject an empty section list',
  '/api/admin/settings/storefront',
  {
    role: 'ADMIN', method: 'POST', body: {
      shippingPolicy: { title: 'Shipping', summary: 'Summary', lastUpdated: '2026-08-01', sections: [] },
    },
  },
  [400],
);
await expectStatus(
  'Policy settings reject duplicate section identifiers',
  '/api/admin/settings/storefront',
  {
    role: 'ADMIN', method: 'POST', body: {
      termsPolicy: {
        title: 'Terms', summary: 'Summary', lastUpdated: '2026-08-01',
        sections: [
          { id: 'duplicate', heading: 'First', body: 'First body' },
          { id: 'duplicate', heading: 'Second', body: 'Second body' },
        ],
      },
    },
  },
  [400],
);
await expectStatus(
  'Affiliate settings reject an invalid attribution duration',
  '/api/admin/settings/storefront',
  {
    role: 'ADMIN', method: 'POST', body: {
      affiliateProgram: {
        enabled: true,
        defaultCommissionPercent: 10,
        attributionDays: 0,
        eligibleOrderStatuses: ['COMPLETED'],
        cancelledOrderClawback: true,
        returnedOrderClawback: true,
        minimumPayoutPkr: 3000,
        payoutSchedule: 'Monthly',
        payoutMethods: ['Bank transfer'],
        tiers: [{ id: 'standard', name: 'Standard', commissionPercent: 10, qualification: 'New affiliates' }],
        publicTerms: ['Eligible verified orders earn commission.'],
      },
    },
  },
  [400],
);
await expectStatus(
  'Cart-recovery settings reject an invalid delay',
  '/api/admin/settings/storefront',
  {
    role: 'ADMIN', method: 'POST', body: {
      abandonedCartRecovery: {
        enabled: false,
        delayHours: 0,
        subject: 'Subject',
        heading: 'Heading',
        message: 'Message {{cartTotal}}',
        ctaText: 'Return to cart',
      },
    },
  },
  [400],
);

let originalStorefrontSettings = null;
try {
  const originalResponse = await request('/api/admin/settings/storefront', { role: 'ADMIN' });
  const originalPayload = await originalResponse.json();
  if (!originalResponse.ok || !originalPayload.success) throw new Error('Could not capture existing storefront settings.');
  originalStorefrontSettings = originalPayload.data;

  const configuredResponse = await request('/api/admin/settings/storefront', {
    role: 'ADMIN',
    method: 'POST',
    body: {
      manualPaymentEnabled: true,
      bankName: 'Admin QA Bank',
      bankAccountTitle: 'Admin QA',
      bankAccountNumber: 'QA-12345',
      bankIban: '',
      easypaisaAccountTitle: '',
      easypaisaAccountNumber: '',
      jazzcashAccountTitle: '',
      jazzcashAccountNumber: '',
      manualPaymentInstructions: 'Admin QA instructions',
    },
  });
  const configuredPayload = await configuredResponse.json();
  if (!configuredResponse.ok || !configuredPayload.data?.manualPaymentAvailable) {
    throw new Error('A complete bank destination did not activate manual payment.');
  }

  const publicConfiguredResponse = await request('/api/storefront-settings');
  const publicConfiguredPayload = await publicConfiguredResponse.json();
  if (!publicConfiguredResponse.ok || publicConfiguredPayload.data?.bankAccountNumber !== 'QA-12345') {
    throw new Error('Configured payment destination was not returned to checkout.');
  }

  const hiddenResponse = await request('/api/admin/settings/storefront', {
    role: 'ADMIN',
    method: 'POST',
    body: {
      manualPaymentEnabled: true,
      bankName: '',
      bankAccountTitle: '',
      bankAccountNumber: '',
      bankIban: '',
      easypaisaAccountTitle: '',
      easypaisaAccountNumber: '',
      jazzcashAccountTitle: '',
      jazzcashAccountNumber: '',
    },
  });
  const hiddenPayload = await hiddenResponse.json();
  if (!hiddenResponse.ok || hiddenPayload.data?.manualPaymentAvailable !== false) {
    throw new Error('Incomplete payment destinations were not hidden.');
  }

  pass('Manual-payment settings: configured destinations publish and empty destinations hide');
} catch (error) {
  fail('Manual-payment settings lifecycle', error instanceof Error ? error.message : String(error));
} finally {
  if (originalStorefrontSettings) {
    const { manualPaymentAvailable: _computedAvailability, ...restorableSettings } = originalStorefrontSettings;
    void _computedAvailability;
    const restoreResponse = await request('/api/admin/settings/storefront', {
      role: 'ADMIN',
      method: 'POST',
      body: restorableSettings,
    }).catch(() => null);
    if (!restoreResponse?.ok) fail('Manual-payment settings: restore', 'Original storefront settings could not be restored.');
  }
}

let originalBusinessSettings = null;
try {
  const originalResponse = await request('/api/admin/settings/storefront', { role: 'ADMIN' });
  const originalPayload = await originalResponse.json();
  if (!originalResponse.ok || !originalPayload.success) throw new Error('Could not capture existing business settings.');
  originalBusinessSettings = originalPayload.data;

  const configuredResponse = await request('/api/admin/settings/storefront', {
    role: 'ADMIN',
    method: 'POST',
    body: {
      supportEmail: 'support-admin-qa@example.invalid',
      supportPhone: '+92 300 0000000',
      whatsappUrl: 'https://wa.me/923000000000',
      businessAddress: 'Admin QA public business address',
      returnAddress: 'Admin QA return address',
      facebookUrl: 'https://facebook.com/admin-qa',
      instagramUrl: 'https://instagram.com/admin-qa',
      tiktokUrl: '',
      youtubeUrl: '',
    },
  });
  if (!configuredResponse.ok) throw new Error(`Valid business settings returned HTTP ${configuredResponse.status}.`);

  const publicResponse = await request('/api/storefront-settings');
  const publicPayload = await publicResponse.json();
  if (!publicResponse.ok || publicPayload.data?.supportEmail !== 'support-admin-qa@example.invalid') {
    throw new Error('Configured business contacts were not returned to the storefront.');
  }
  if (publicPayload.data?.whatsappUrl !== 'https://wa.me/923000000000') {
    throw new Error('Configured WhatsApp URL was not returned to the storefront.');
  }

  const clearedResponse = await request('/api/admin/settings/storefront', {
    role: 'ADMIN',
    method: 'POST',
    body: {
      supportEmail: '', supportPhone: '', whatsappUrl: '', businessAddress: '', returnAddress: '',
      facebookUrl: '', instagramUrl: '', tiktokUrl: '', youtubeUrl: '',
    },
  });
  const clearedPayload = await clearedResponse.json();
  if (!clearedResponse.ok || clearedPayload.data?.supportEmail || clearedPayload.data?.whatsappUrl) {
    throw new Error('Cleared contact details were not hidden from public settings.');
  }

  pass('Business contact settings: valid details publish and empty details hide');
} catch (error) {
  fail('Business contact settings lifecycle', error instanceof Error ? error.message : String(error));
} finally {
  if (originalBusinessSettings) {
    const { manualPaymentAvailable: _computedAvailability, ...restorableSettings } = originalBusinessSettings;
    void _computedAvailability;
    const restoreResponse = await request('/api/admin/settings/storefront', {
      role: 'ADMIN', method: 'POST', body: restorableSettings,
    }).catch(() => null);
    if (!restoreResponse?.ok) fail('Business contact settings: restore', 'Original storefront settings could not be restored.');
  }
}

let originalPolicySettings = null;
try {
  const originalResponse = await request('/api/admin/settings/storefront', { role: 'ADMIN' });
  const originalPayload = await originalResponse.json();
  if (!originalResponse.ok || !originalPayload.success) throw new Error('Could not capture existing policy settings.');
  originalPolicySettings = originalPayload.data;

  const qaPolicy = {
    title: 'Admin QA Shipping Policy',
    summary: 'Temporary policy used by the automated admin lifecycle test.',
    lastUpdated: '2026-08-01',
    sections: [{ id: 'admin-qa-policy-section', heading: 'Admin QA section', body: 'Temporary safe plain-text content.' }],
  };
  const configuredResponse = await request('/api/admin/settings/storefront', {
    role: 'ADMIN', method: 'POST', body: { shippingPolicy: qaPolicy },
  });
  if (!configuredResponse.ok) throw new Error(`Valid policy settings returned HTTP ${configuredResponse.status}.`);

  const publicResponse = await request('/api/storefront-settings');
  const publicPayload = await publicResponse.json();
  if (!publicResponse.ok || publicPayload.data?.shippingPolicy?.title !== qaPolicy.title) {
    throw new Error('Configured policy was not returned to the storefront.');
  }
  if (publicPayload.data?.shippingPolicy?.sections?.[0]?.body !== qaPolicy.sections[0].body) {
    throw new Error('Configured policy sections were not returned to the storefront.');
  }

  pass('Policy settings: structured content saves and publishes');
} catch (error) {
  fail('Policy settings lifecycle', error instanceof Error ? error.message : String(error));
} finally {
  if (originalPolicySettings) {
    const { manualPaymentAvailable: _computedAvailability, ...restorableSettings } = originalPolicySettings;
    void _computedAvailability;
    const restoreResponse = await request('/api/admin/settings/storefront', {
      role: 'ADMIN', method: 'POST', body: restorableSettings,
    }).catch(() => null);
    if (!restoreResponse?.ok) fail('Policy settings: restore', 'Original storefront settings could not be restored.');
  }
}

let originalAffiliateSettings = null;
try {
  const originalResponse = await request('/api/admin/settings/storefront', { role: 'ADMIN' });
  const originalPayload = await originalResponse.json();
  if (!originalResponse.ok || !originalPayload.success) throw new Error('Could not capture existing affiliate settings.');
  originalAffiliateSettings = originalPayload.data;
  const qaAffiliateProgram = {
    enabled: true,
    defaultCommissionPercent: 12.5,
    attributionDays: 21,
    eligibleOrderStatuses: ['SHIPPED', 'COMPLETED'],
    cancelledOrderClawback: true,
    returnedOrderClawback: true,
    minimumPayoutPkr: 2500,
    payoutSchedule: 'Admin QA monthly schedule',
    payoutMethods: ['Admin QA transfer'],
    tiers: [{ id: 'admin-qa-tier', name: 'Admin QA tier', commissionPercent: 12.5, qualification: 'Temporary QA qualification' }],
    publicTerms: ['Temporary QA public affiliate term.'],
  };
  const configuredResponse = await request('/api/admin/settings/storefront', {
    role: 'ADMIN', method: 'POST', body: { affiliateProgram: qaAffiliateProgram },
  });
  if (!configuredResponse.ok) throw new Error(`Valid affiliate settings returned HTTP ${configuredResponse.status}.`);
  const publicResponse = await request('/api/storefront-settings');
  const publicPayload = await publicResponse.json();
  if (!publicResponse.ok || publicPayload.data?.affiliateProgram?.defaultCommissionPercent !== 12.5) throw new Error('Affiliate default commission was not published.');
  if (publicPayload.data?.affiliateProgram?.tiers?.[0]?.id !== 'admin-qa-tier') throw new Error('Affiliate tiers were not published.');
  pass('Affiliate settings: structured rules save and publish');
} catch (error) {
  fail('Affiliate settings lifecycle', error instanceof Error ? error.message : String(error));
} finally {
  if (originalAffiliateSettings) {
    const { manualPaymentAvailable: _computedAvailability, ...restorableSettings } = originalAffiliateSettings;
    void _computedAvailability;
    const restoreResponse = await request('/api/admin/settings/storefront', {
      role: 'ADMIN', method: 'POST', body: restorableSettings,
    }).catch(() => null);
    if (!restoreResponse?.ok) fail('Affiliate settings: restore', 'Original storefront settings could not be restored.');
  }
}

let originalRecoverySettings = null;
try {
  const originalResponse = await request('/api/admin/settings/storefront', { role: 'ADMIN' });
  const originalPayload = await originalResponse.json();
  if (!originalResponse.ok || !originalPayload.success) throw new Error('Could not capture existing cart-recovery settings.');
  originalRecoverySettings = originalPayload.data;
  const qaRecovery = {
    enabled: Boolean(originalPayload.data?.abandonedCartRecovery?.enabled),
    delayHours: 5,
    subject: 'Admin QA recovery subject',
    heading: 'Admin QA recovery heading',
    message: 'Admin QA saved cart total: {{cartTotal}}.',
    ctaText: 'Admin QA return',
  };
  const configuredResponse = await request('/api/admin/settings/storefront', {
    role: 'ADMIN', method: 'POST', body: { abandonedCartRecovery: qaRecovery },
  });
  if (!configuredResponse.ok) throw new Error(`Valid cart-recovery settings returned HTTP ${configuredResponse.status}.`);
  const publicResponse = await request('/api/storefront-settings');
  const publicPayload = await publicResponse.json();
  if (!publicResponse.ok || publicPayload.data?.abandonedCartRecovery?.delayHours !== 5) throw new Error('Cart-recovery delay was not published.');
  if (publicPayload.data?.abandonedCartRecovery?.message !== qaRecovery.message) throw new Error('Cart-recovery message was not published.');
  pass('Cart-recovery settings: timing and content save and publish');
} catch (error) {
  fail('Cart-recovery settings lifecycle', error instanceof Error ? error.message : String(error));
} finally {
  if (originalRecoverySettings) {
    const { manualPaymentAvailable: _computedAvailability, ...restorableSettings } = originalRecoverySettings;
    void _computedAvailability;
    const restoreResponse = await request('/api/admin/settings/storefront', {
      role: 'ADMIN', method: 'POST', body: restorableSettings,
    }).catch(() => null);
    if (!restoreResponse?.ok) fail('Cart-recovery settings: restore', 'Original storefront settings could not be restored.');
  }
}

const fixtureSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function runCrudLifecycle({ label, createPath, createBody, createStatus, getId, updatePath, updateBody, deletePath }) {
  let fixtureId = null;
  try {
    const createResponse = await request(createPath, { role: 'ADMIN', method: 'POST', body: createBody });
    const createPayload = await createResponse.json();
    if (createResponse.status !== createStatus) {
      fail(`${label}: create`, `HTTP ${createResponse.status}`);
      return;
    }
    fixtureId = getId(createPayload);
    if (!fixtureId) {
      fail(`${label}: create`, 'Created fixture ID was not returned.');
      return;
    }
    pass(`${label}: create`, `HTTP ${createResponse.status}`);

    const updateResponse = await request(updatePath(fixtureId), {
      role: 'ADMIN',
      method: updateBody.method,
      body: updateBody.body,
    });
    if (updateResponse.status !== 200) {
      fail(`${label}: update`, `HTTP ${updateResponse.status}`);
    } else {
      pass(`${label}: update`, 'HTTP 200');
    }

    const deleteResponse = await request(deletePath(fixtureId), { role: 'ADMIN', method: 'DELETE' });
    if (deleteResponse.status !== 200) {
      fail(`${label}: delete`, `HTTP ${deleteResponse.status}`);
    } else {
      pass(`${label}: delete`, 'HTTP 200');
      fixtureId = null;
    }
  } catch (error) {
    fail(`${label}: lifecycle`, error instanceof Error ? error.message : String(error));
  } finally {
    if (fixtureId) {
      const cleanup = await request(deletePath(fixtureId), { role: 'ADMIN', method: 'DELETE' }).catch(() => null);
      if (!cleanup || !cleanup.ok) fail(`${label}: cleanup`, 'Temporary fixture could not be removed.');
    }
  }
}

await runCrudLifecycle({
  label: 'Collection CRUD',
  createPath: '/api/collections',
  createBody: {
    name: `Admin QA Collection ${fixtureSuffix}`,
    slug: `admin-qa-collection-${fixtureSuffix}`,
    description: 'Temporary automated QA fixture.',
    image: '/logo_main.png',
    targetGender: 'UNISEX',
    sendPromoEmail: false,
  },
  createStatus: 200,
  getId: (payload) => payload.collection?.id,
  updatePath: (id) => `/api/collections/${id}`,
  updateBody: { method: 'PATCH', body: { description: 'Updated automated QA fixture.' } },
  deletePath: (id) => `/api/collections/${id}`,
});

await runCrudLifecycle({
  label: 'Banner CRUD',
  createPath: '/api/banners',
  createBody: {
    category: 'HOME_MAIN',
    desktopImageUrl: '/logo_main.png',
    mobileImageUrl: '/logo_main.png',
    desktopImageSlot: 1,
    mobileImageSlot: 2,
    title: `Admin QA Banner ${fixtureSuffix}`,
    textPosition: 'OVERLAY',
    isActive: false,
    order: 9999,
  },
  createStatus: 201,
  getId: (payload) => payload.banner?.id,
  updatePath: (id) => `/api/banners/${id}`,
  updateBody: { method: 'PUT', body: { subtitle: 'Updated automated QA fixture.' } },
  deletePath: (id) => `/api/banners/${id}`,
});

await runCrudLifecycle({
  label: 'Reel CRUD',
  createPath: '/api/reels',
  createBody: {
    category: 'SHORT_REELS',
    title: `Admin QA Reel ${fixtureSuffix}`,
    caption: 'Temporary automated QA fixture.',
    videoUrl: '/demo/admin-qa-video.mp4',
    isActive: false,
    order: 9999,
  },
  createStatus: 201,
  getId: (payload) => payload.reel?.id,
  updatePath: (id) => `/api/reels/${id}`,
  updateBody: { method: 'PUT', body: { caption: 'Updated automated QA fixture.' } },
  deletePath: (id) => `/api/reels/${id}`,
});

await runCrudLifecycle({
  label: 'Blog CRUD',
  createPath: '/api/admin/blogs',
  createBody: {
    title: `Admin QA Blog ${fixtureSuffix}`,
    description: 'Temporary automated QA fixture.',
    content: 'This temporary post verifies the admin blog lifecycle.',
    isPublished: false,
  },
  createStatus: 200,
  getId: (payload) => payload.data?.id,
  updatePath: (id) => `/api/admin/blogs/${id}`,
  updateBody: { method: 'PUT', body: { description: 'Updated automated QA fixture.' } },
  deletePath: (id) => `/api/admin/blogs/${id}`,
});

let shippingFixtureId = null;
let shippingCityId = null;
try {
  const regionResponse = await request('/api/shipping', {
    role: 'ADMIN',
    method: 'POST',
    body: { name: `Admin QA Region ${fixtureSuffix}`, shippingCost: 123 },
  });
  const regionPayload = await regionResponse.json();
  shippingFixtureId = regionPayload.data?.id || null;
  if (regionResponse.status === 201 && shippingFixtureId) pass('Shipping CRUD: create region', 'HTTP 201');
  else fail('Shipping CRUD: create region', `HTTP ${regionResponse.status}`);

  if (shippingFixtureId) {
    const cityResponse = await request(`/api/shipping/${shippingFixtureId}`, {
      role: 'ADMIN',
      method: 'POST',
      body: { name: `Admin QA City ${fixtureSuffix}` },
    });
    const cityPayload = await cityResponse.json();
    shippingCityId = cityPayload.data?.id || null;
    if (cityResponse.status === 201 && shippingCityId) pass('Shipping CRUD: create city', 'HTTP 201');
    else fail('Shipping CRUD: create city', `HTTP ${cityResponse.status}`);

    const rateResponse = await request(`/api/shipping/${shippingFixtureId}`, {
      role: 'ADMIN',
      method: 'PUT',
      body: { shippingCost: 321 },
    });
    if (rateResponse.status === 200) pass('Shipping CRUD: update rate', 'HTTP 200');
    else fail('Shipping CRUD: update rate', `HTTP ${rateResponse.status}`);

    if (shippingCityId) {
      const cityDelete = await request(`/api/shipping/${shippingFixtureId}?cityId=${shippingCityId}`, {
        role: 'ADMIN',
        method: 'DELETE',
      });
      if (cityDelete.status === 200) {
        pass('Shipping CRUD: delete city', 'HTTP 200');
        shippingCityId = null;
      } else fail('Shipping CRUD: delete city', `HTTP ${cityDelete.status}`);
    }

    const regionDelete = await request(`/api/shipping/${shippingFixtureId}`, { role: 'ADMIN', method: 'DELETE' });
    if (regionDelete.status === 200) {
      pass('Shipping CRUD: delete region', 'HTTP 200');
      shippingFixtureId = null;
    } else fail('Shipping CRUD: delete region', `HTTP ${regionDelete.status}`);
  }
} catch (error) {
  fail('Shipping CRUD: lifecycle', error instanceof Error ? error.message : String(error));
} finally {
  if (shippingFixtureId) {
    const cleanup = await request(`/api/shipping/${shippingFixtureId}`, { role: 'ADMIN', method: 'DELETE' }).catch(() => null);
    if (!cleanup || !cleanup.ok) fail('Shipping CRUD: cleanup', 'Temporary fixture could not be removed.');
  }
}

const statePanels = [
  'AdminAnalyticsPanel.tsx',
  'AdminAffiliateRulesPanel.tsx',
  'AdminBannerPanel.tsx',
  'AdminBlogsPanel.tsx',
  'AdminBusinessSettingsPanel.tsx',
  'AdminCartRecoveryPanel.tsx',
  'AdminCollectionsPanel.tsx',
  'AdminConversionPanel.tsx',
  'AdminCustomersPanel.tsx',
  'AdminHomepageBuilderPanel.tsx',
  'AdminInventoryPanel.tsx',
  'AdminMarketingPanel.tsx',
  'AdminNewsletterPanel.tsx',
  'AdminOrdersPanel.tsx',
  'AdminPoliciesPanel.tsx',
  'AdminProductsPanel.tsx',
  'AdminReelsPanel.tsx',
  'AdminReviewsPanel.tsx',
  'AdminSalePanel.tsx',
  'AdminShippingPanel.tsx',
  'AdminSystemStatusPanel.tsx',
  'AffiliateApplicationsPanel.tsx',
  'PromoUsersManagement.tsx',
];

for (const panel of statePanels) {
  const source = await readFile(new URL(`../app/admin/components/${panel}`, import.meta.url), 'utf8');
  if (source.includes('AdminAsyncState')) {
    pass(`${panel}: shared async-state UI`);
  } else {
    fail(`${panel}: shared async-state UI`, 'AdminAsyncState import is missing.');
  }
}

const dashboardSource = await readFile(new URL('../app/admin/page.tsx', import.meta.url), 'utf8');
if (dashboardSource.includes('AdminAsyncState')) {
  pass('Admin dashboard overview: shared async-state UI');
} else {
  fail('Admin dashboard overview: shared async-state UI', 'AdminAsyncState import is missing.');
}

const failed = results.filter((result) => !result.ok);
for (const result of results) {
  console.log(`${result.ok ? '✓' : '✗'} ${result.name}${result.detail ? ` — ${result.detail}` : ''}`);
}
console.log(`\nAdmin QA: ${results.length - failed.length}/${results.length} checks passed.`);

if (failed.length > 0) process.exitCode = 1;
