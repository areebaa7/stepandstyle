import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { getNewsletterSettings, type EmailMarketingProvider } from '@/lib/newsletterSettings.server';
import { syncEmailMarketingProvider, syncWooCommerceCustomer } from '@/lib/newsletterIntegrations.server';

export interface AbandonedCartDocument {
  _id?: string;
  userId: string;
  email: string;
  subtotal: number;
  status: 'ACTIVE' | 'RECOVERED';
}

const firstBatch = (result: unknown): Record<string, unknown>[] => {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return [];
  const cursor = (result as Record<string, unknown>).cursor;
  if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) return [];
  const batch = (cursor as Record<string, unknown>).firstBatch;
  return Array.isArray(batch)
    ? batch.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry))
    : [];
};

let newsletterIndexesPromise: Promise<unknown> | null = null;

async function ensureNewsletterIndexes() {
  if (!newsletterIndexesPromise) {
    newsletterIndexesPromise = Promise.all([
      prisma.$runCommandRaw({
        createIndexes: 'NewsletterSubscribers',
        indexes: [
          { key: { email: 1 }, name: 'NewsletterSubscribers_email_key', unique: true },
          { key: { unsubscribeToken: 1 }, name: 'NewsletterSubscribers_unsubscribeToken_key', unique: true },
        ],
      }),
      prisma.$runCommandRaw({
        createIndexes: 'NewsletterRateLimits',
        indexes: [{ key: { expiresAt: 1 }, name: 'NewsletterRateLimits_expiresAt_ttl', expireAfterSeconds: 0 }],
      }),
    ]).catch((error) => {
      newsletterIndexesPromise = null;
      throw error;
    });
  }
  await newsletterIndexesPromise;
}

const hashIdentity = (value: string) => createHash('sha256')
  .update(`${process.env.SESSION_SECRET || process.env.JWT_SECRET || 'step-and-styl'}:${value}`)
  .digest('hex');

export async function consumeNewsletterRateLimit(identity: string, maxAttempts = 5) {
  await ensureNewsletterIndexes();
  const windowMs = 15 * 60 * 1000;
  const now = new Date();
  const windowNumber = Math.floor(now.getTime() / windowMs);
  const id = hashIdentity(`${identity}:${windowNumber}`);
  const expiresAt = new Date((windowNumber + 2) * windowMs);

  try {
    await prisma.newsletterRateLimit.create({ data: { id, count: 1, windowStartedAt: now, expiresAt } });
    return true;
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
    if (code !== 'P2002') throw error;
  }

  const updated = await prisma.newsletterRateLimit.update({
    where: { id },
    data: { count: { increment: 1 } },
  });
  return updated.count <= maxAttempts;
}

export interface NewsletterSubscriptionInput {
  email: string;
  source: 'footer' | 'checkout' | 'popup' | 'admin';
  consent: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function subscribeNewsletter(input: NewsletterSubscriptionInput) {
  if (!input.consent) throw new Error('Marketing consent is required.');
  await ensureNewsletterIndexes();
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error('Email address is required.');

  const settings = await getNewsletterSettings();
  const now = new Date();
  const provider = settings.provider;
  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: {
      status: 'SUBSCRIBED', source: input.source, consentAt: now,
      consentText: settings.consentText, consentVersion: settings.consentVersion,
      ipHash: input.ipAddress ? hashIdentity(input.ipAddress) : null,
      userAgent: input.userAgent?.slice(0, 500) || null, provider,
      providerSyncStatus: provider === 'NONE' ? 'SKIPPED' : 'PENDING', providerError: null,
      wooSyncStatus: settings.wooCommerceSyncEnabled ? 'PENDING' : 'SKIPPED', wooError: null,
      unsubscribedAt: null,
    },
    create: {
      email, status: 'SUBSCRIBED', source: input.source, consentAt: now,
      consentText: settings.consentText, consentVersion: settings.consentVersion,
      ipHash: input.ipAddress ? hashIdentity(input.ipAddress) : null,
      userAgent: input.userAgent?.slice(0, 500) || null, provider,
      providerSyncStatus: provider === 'NONE' ? 'SKIPPED' : 'PENDING',
      wooSyncStatus: settings.wooCommerceSyncEnabled ? 'PENDING' : 'SKIPPED',
      unsubscribeToken: randomBytes(32).toString('hex'),
    },
  });

  const [providerResult, wooResult] = await Promise.all([
    syncEmailMarketingProvider(provider, email, true),
    settings.wooCommerceSyncEnabled
      ? syncWooCommerceCustomer(email, true)
      : Promise.resolve({ status: 'SKIPPED' as const, error: undefined }),
  ]);
  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      providerSyncStatus: providerResult.status, providerContactId: providerResult.contactId || null,
      providerSyncedAt: providerResult.status === 'SYNCED' ? new Date() : null,
      providerError: providerResult.error || null, wooSyncStatus: wooResult.status,
      wooSyncedAt: wooResult.status === 'SYNCED' ? new Date() : null, wooError: wooResult.error || null,
    },
  });

  return {
    subscriberId: subscriber.id,
    discountCode: settings.incentiveEnabled && settings.discountCode ? settings.discountCode : null,
  };
}

export async function unsubscribeNewsletter(token: string) {
  await ensureNewsletterIndexes();
  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token } });
  if (!subscriber) return false;

  const settings = await getNewsletterSettings();
  const provider = (
    ['MAILCHIMP', 'BREVO', 'KLAVIYO'].includes(subscriber.provider)
      ? subscriber.provider
      : settings.provider
  ) as EmailMarketingProvider;
  const [providerResult, wooResult] = await Promise.all([
    syncEmailMarketingProvider(provider, subscriber.email, false),
    settings.wooCommerceSyncEnabled
      ? syncWooCommerceCustomer(subscriber.email, false)
      : Promise.resolve({ status: 'SKIPPED' as const, error: undefined }),
  ]);

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      status: 'UNSUBSCRIBED', unsubscribedAt: new Date(),
      providerSyncStatus: providerResult.status,
      providerSyncedAt: providerResult.status === 'SYNCED' ? new Date() : null,
      providerError: providerResult.error || null,
      wooSyncStatus: wooResult.status,
      wooSyncedAt: wooResult.status === 'SYNCED' ? new Date() : null,
      wooError: wooResult.error || null,
    },
  });
  return true;
}

export async function saveAbandonedCart(
  userId: string,
  email: string,
  items: Prisma.InputJsonObject[],
  subtotal: number,
) {
  const now = { $date: new Date().toISOString() };
  await prisma.$runCommandRaw({
    update: 'AbandonedCarts',
    updates: [{
      q: { userId },
      u: {
        $set: {
          userId,
          email: email.toLowerCase(),
          items,
          subtotal,
          status: 'ACTIVE',
          lastActivity: now,
          recoverySentAt: null,
        },
        $setOnInsert: { createdAt: now },
      },
      upsert: true,
    }],
  });
}

export async function markAbandonedCartRecovered(userId: string) {
  await prisma.$runCommandRaw({
    update: 'AbandonedCarts',
    updates: [{
      q: { userId },
      u: { $set: { status: 'RECOVERED', recoveredAt: { $date: new Date().toISOString() } } },
      multi: true,
    }],
  });
}

export async function getRecoverableCarts(delayHours = 2, enabledAt?: string | null): Promise<AbandonedCartDocument[]> {
  const cutoff = new Date(Date.now() - delayHours * 60 * 60 * 1000).toISOString();
  const validEnabledAt = enabledAt && !Number.isNaN(Date.parse(enabledAt)) ? enabledAt : null;
  const activityWindow: Prisma.InputJsonObject = validEnabledAt
    ? { $lte: { $date: cutoff }, $gte: { $date: validEnabledAt } }
    : { $lte: { $date: cutoff } };
  const result = await prisma.$runCommandRaw({
    find: 'AbandonedCarts',
    filter: {
      status: 'ACTIVE',
      recoverySentAt: null,
      lastActivity: activityWindow,
    },
    limit: 50,
  });
  return firstBatch(result)
    .map<AbandonedCartDocument>((document) => ({
      _id: typeof document._id === 'string' ? document._id : undefined,
      userId: String(document.userId || ''),
      email: String(document.email || ''),
      subtotal: Number(document.subtotal) || 0,
      status: document.status === 'RECOVERED' ? 'RECOVERED' : 'ACTIVE',
    }))
    .filter((cart) => Boolean(cart.userId && cart.email));
}

export async function markRecoveryEmailSent(userId: string) {
  await prisma.$runCommandRaw({
    update: 'AbandonedCarts',
    updates: [{
      q: { userId },
      u: { $set: { recoverySentAt: { $date: new Date().toISOString() } } },
    }],
  });
}
