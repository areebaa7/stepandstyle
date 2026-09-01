import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import {
  normalizeHomepageSections,
} from '@/lib/storefrontSettings';
import type { AbandonedCartRecoverySettings, AffiliateEligibleOrderStatus, AffiliateProgramSettings, StorePolicyKey, StorePolicyPage } from '@/types/storefrontSettings';
import {
  getStorefrontSettings,
  updateStorefrontSettings,
  type StorefrontSettingsUpdate,
} from '@/lib/storefrontSettings.server';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+0-9().\s-]+$/;
const POLICY_KEYS: StorePolicyKey[] = ['shippingPolicy', 'returnsPolicy', 'privacyPolicy', 'termsPolicy'];
const POLICY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const AFFILIATE_ORDER_STATUSES = new Set<AffiliateEligibleOrderStatus>(['PAID', 'SHIPPED', 'COMPLETED']);

const allowedSocialHosts = {
  whatsappUrl: ['wa.me', 'api.whatsapp.com', 'www.whatsapp.com'],
  facebookUrl: ['facebook.com'],
  instagramUrl: ['instagram.com'],
  tiktokUrl: ['tiktok.com'],
  youtubeUrl: ['youtube.com', 'youtu.be'],
} as const;

function hostMatches(hostname: string, allowedHosts: readonly string[]) {
  const normalized = hostname.toLowerCase();
  return allowedHosts.some((host) => normalized === host || normalized.endsWith(`.${host}`));
}

function isAllowedExternalUrl(value: string, allowedHosts: readonly string[]) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && hostMatches(url.hostname, allowedHosts);
  } catch {
    return false;
  }
}

function isValidPolicyDate(value: string) {
  if (!POLICY_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function parsePolicy(value: unknown): { data?: StorePolicyPage; error?: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { error: 'Policy content must be an object.' };
  }

  const policy = value as Record<string, unknown>;
  const title = typeof policy.title === 'string' ? policy.title.trim() : '';
  const summary = typeof policy.summary === 'string' ? policy.summary.trim() : '';
  const lastUpdated = typeof policy.lastUpdated === 'string' ? policy.lastUpdated.trim() : '';

  if (!title || title.length > 120) return { error: 'Policy title must be between 1 and 120 characters.' };
  if (!summary || summary.length > 500) return { error: 'Policy summary must be between 1 and 500 characters.' };
  if (!isValidPolicyDate(lastUpdated)) {
    return { error: 'Policy update date must be a valid date.' };
  }
  if (!Array.isArray(policy.sections) || policy.sections.length < 1 || policy.sections.length > 20) {
    return { error: 'A policy must contain between 1 and 20 sections.' };
  }

  const ids = new Set<string>();
  const sections: StorePolicyPage['sections'] = [];
  for (const entry of policy.sections) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return { error: 'Every policy section must be an object.' };
    }
    const section = entry as Record<string, unknown>;
    const id = typeof section.id === 'string' ? section.id.trim() : '';
    const heading = typeof section.heading === 'string' ? section.heading.trim() : '';
    const body = typeof section.body === 'string' ? section.body.trim() : '';
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) return { error: 'Every policy section needs a valid identifier.' };
    if (ids.has(id)) return { error: 'Policy section identifiers must be unique.' };
    if (!heading || heading.length > 120) return { error: 'Policy section headings must be between 1 and 120 characters.' };
    if (!body || body.length > 4000) return { error: 'Policy section text must be between 1 and 4000 characters.' };
    ids.add(id);
    sections.push({ id, heading, body });
  }

  return { data: { title, summary, lastUpdated, sections } };
}

function parseAffiliateProgram(value: unknown): { data?: AffiliateProgramSettings; error?: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'Affiliate settings must be an object.' };
  const settings = value as Record<string, unknown>;
  if (typeof settings.enabled !== 'boolean' || typeof settings.cancelledOrderClawback !== 'boolean' || typeof settings.returnedOrderClawback !== 'boolean') {
    return { error: 'Affiliate switches must be true or false.' };
  }
  const defaultCommissionPercent = Number(settings.defaultCommissionPercent);
  const attributionDays = Number(settings.attributionDays);
  const minimumPayoutPkr = Number(settings.minimumPayoutPkr);
  if (!Number.isFinite(defaultCommissionPercent) || defaultCommissionPercent < 0 || defaultCommissionPercent > 100) return { error: 'Default commission must be between 0 and 100.' };
  if (!Number.isInteger(attributionDays) || attributionDays < 1 || attributionDays > 365) return { error: 'Attribution duration must be between 1 and 365 days.' };
  if (!Number.isFinite(minimumPayoutPkr) || minimumPayoutPkr < 0 || minimumPayoutPkr > 100000000) return { error: 'Minimum payout must be between 0 and PKR 100,000,000.' };
  const payoutSchedule = typeof settings.payoutSchedule === 'string' ? settings.payoutSchedule.trim() : '';
  if (!payoutSchedule || payoutSchedule.length > 120) return { error: 'Payout schedule must be between 1 and 120 characters.' };

  if (!Array.isArray(settings.eligibleOrderStatuses) || settings.eligibleOrderStatuses.length < 1) return { error: 'Select at least one commission-eligible order status.' };
  const eligibleOrderStatuses = Array.from(new Set(settings.eligibleOrderStatuses));
  if (eligibleOrderStatuses.some((status) => typeof status !== 'string' || !AFFILIATE_ORDER_STATUSES.has(status as AffiliateEligibleOrderStatus))) return { error: 'Affiliate order status is invalid.' };

  if (!Array.isArray(settings.payoutMethods) || settings.payoutMethods.length < 1 || settings.payoutMethods.length > 10) return { error: 'Provide between 1 and 10 payout methods.' };
  const payoutMethods = settings.payoutMethods.map((method) => typeof method === 'string' ? method.trim() : '');
  if (payoutMethods.some((method) => !method || method.length > 80)) return { error: 'Each payout method must be between 1 and 80 characters.' };

  if (!Array.isArray(settings.tiers) || settings.tiers.length < 1 || settings.tiers.length > 10) return { error: 'Provide between 1 and 10 commission tiers.' };
  const tierIds = new Set<string>();
  const tiers: AffiliateProgramSettings['tiers'] = [];
  for (const entry of settings.tiers) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return { error: 'Every commission tier must be an object.' };
    const tier = entry as Record<string, unknown>;
    const id = typeof tier.id === 'string' ? tier.id.trim() : '';
    const name = typeof tier.name === 'string' ? tier.name.trim() : '';
    const qualification = typeof tier.qualification === 'string' ? tier.qualification.trim() : '';
    const commissionPercent = Number(tier.commissionPercent);
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(id) || tierIds.has(id)) return { error: 'Commission tier identifiers must be valid and unique.' };
    if (!name || name.length > 100 || !qualification || qualification.length > 240) return { error: 'Every tier needs a valid name and qualification.' };
    if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) return { error: 'Tier commission must be between 0 and 100.' };
    tierIds.add(id);
    tiers.push({ id, name, qualification, commissionPercent });
  }

  if (!Array.isArray(settings.publicTerms) || settings.publicTerms.length < 1 || settings.publicTerms.length > 20) return { error: 'Provide between 1 and 20 public affiliate terms.' };
  const publicTerms = settings.publicTerms.map((term) => typeof term === 'string' ? term.trim() : '');
  if (publicTerms.some((term) => !term || term.length > 500)) return { error: 'Each public affiliate term must be between 1 and 500 characters.' };

  return {
    data: {
      enabled: settings.enabled,
      defaultCommissionPercent,
      attributionDays,
      eligibleOrderStatuses: eligibleOrderStatuses as AffiliateEligibleOrderStatus[],
      cancelledOrderClawback: settings.cancelledOrderClawback,
      returnedOrderClawback: settings.returnedOrderClawback,
      minimumPayoutPkr,
      payoutSchedule,
      payoutMethods: Array.from(new Set(payoutMethods)),
      tiers,
      publicTerms,
    },
  };
}

function parseAbandonedCartRecovery(value: unknown): { data?: AbandonedCartRecoverySettings; error?: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'Cart-recovery settings must be an object.' };
  const settings = value as Record<string, unknown>;
  if (typeof settings.enabled !== 'boolean') return { error: 'Cart-recovery enabled state must be true or false.' };
  const delayHours = Number(settings.delayHours);
  if (!Number.isInteger(delayHours) || delayHours < 1 || delayHours > 168) return { error: 'Cart-recovery delay must be between 1 and 168 hours.' };
  const limits = { subject: 160, heading: 120, message: 1000, ctaText: 80 } as const;
  const content = {} as Pick<AbandonedCartRecoverySettings, 'subject' | 'heading' | 'message' | 'ctaText'>;
  for (const [field, maxLength] of Object.entries(limits) as Array<[keyof typeof limits, number]>) {
    const text = typeof settings[field] === 'string' ? settings[field].trim() : '';
    if (!text || text.length > maxLength) return { error: `${field} must be between 1 and ${maxLength} characters.` };
    content[field] = text;
  }
  return { data: { enabled: settings.enabled, enabledAt: null, delayHours, ...content } };
}

export async function GET(request: Request) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: true, data: await getStorefrontSettings() });
  } catch (error) {
    console.error('Error fetching storefront settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch storefront settings.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody: unknown = await request.json();
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ success: false, error: 'Invalid settings payload.' }, { status: 400 });
    }
    const body = rawBody as Record<string, unknown>;

    const updateData: StorefrontSettingsUpdate = {};

    if (body.manualPaymentEnabled !== undefined) {
      if (typeof body.manualPaymentEnabled !== 'boolean') {
        return NextResponse.json({ success: false, error: 'Manual-payment enabled state must be true or false.' }, { status: 400 });
      }
      updateData.manualPaymentEnabled = body.manualPaymentEnabled;
    }

    const paymentTextFields = {
      bankName: 100,
      bankAccountTitle: 100,
      bankAccountNumber: 64,
      bankIban: 64,
      easypaisaAccountTitle: 100,
      easypaisaAccountNumber: 32,
      jazzcashAccountTitle: 100,
      jazzcashAccountNumber: 32,
      manualPaymentInstructions: 500,
    } as const;

    for (const [field, maxLength] of Object.entries(paymentTextFields) as Array<[keyof typeof paymentTextFields, number]>) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'string') {
          return NextResponse.json({ success: false, error: `${field} must be text.` }, { status: 400 });
        }
        const value = body[field].trim();
        if (value.length > maxLength) {
          return NextResponse.json({ success: false, error: `${field} is too long.` }, { status: 400 });
        }
        updateData[field] = value;
      }
    }

    const contactTextFields = {
      supportEmail: 254,
      supportPhone: 32,
      businessAddress: 300,
      returnAddress: 300,
    } as const;

    for (const [field, maxLength] of Object.entries(contactTextFields) as Array<[keyof typeof contactTextFields, number]>) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'string') {
          return NextResponse.json({ success: false, error: `${field} must be text.` }, { status: 400 });
        }
        const value = body[field].trim();
        if (value.length > maxLength) {
          return NextResponse.json({ success: false, error: `${field} is too long.` }, { status: 400 });
        }
        if (field === 'supportEmail' && value && !EMAIL_PATTERN.test(value)) {
          return NextResponse.json({ success: false, error: 'Enter a valid support email address.' }, { status: 400 });
        }
        if (field === 'supportPhone' && value && !PHONE_PATTERN.test(value)) {
          return NextResponse.json({ success: false, error: 'Enter a valid support phone number.' }, { status: 400 });
        }
        updateData[field] = value;
      }
    }

    for (const [field, allowedHosts] of Object.entries(allowedSocialHosts) as Array<[keyof typeof allowedSocialHosts, readonly string[]]>) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'string') {
          return NextResponse.json({ success: false, error: `${field} must be text.` }, { status: 400 });
        }
        const value = body[field].trim();
        if (value.length > 500) {
          return NextResponse.json({ success: false, error: `${field} is too long.` }, { status: 400 });
        }
        if (value && !isAllowedExternalUrl(value, allowedHosts)) {
          return NextResponse.json({ success: false, error: `Enter a valid HTTPS ${field.replace('Url', '')} URL.` }, { status: 400 });
        }
        updateData[field] = value;
      }
    }

    if (body.bankTransferPopupEnabled !== undefined) {
      if (typeof body.bankTransferPopupEnabled !== 'boolean') {
        return NextResponse.json({ success: false, error: 'Popup enabled state must be true or false.' }, { status: 400 });
      }
      updateData.bankTransferPopupEnabled = body.bankTransferPopupEnabled;
    }

    if (body.bankTransferDiscountPercent !== undefined) {
      const discount = Number(body.bankTransferDiscountPercent);
      if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
        return NextResponse.json({ success: false, error: 'Bank-transfer discount must be between 0 and 100.' }, { status: 400 });
      }
      updateData.bankTransferDiscountPercent = discount;
    }

    for (const field of ['bankTransferPopupTitle', 'bankTransferPopupMessage'] as const) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== 'string' || !body[field].trim()) {
          return NextResponse.json({ success: false, error: 'Popup title and message cannot be empty.' }, { status: 400 });
        }
        const maxLength = field === 'bankTransferPopupTitle' ? 100 : 240;
        if (body[field].trim().length > maxLength) {
          return NextResponse.json({ success: false, error: `${field === 'bankTransferPopupTitle' ? 'Title' : 'Message'} is too long.` }, { status: 400 });
        }
        updateData[field] = body[field].trim();
      }
    }

    if (body.homepageSections !== undefined) {
      updateData.homepageSections = normalizeHomepageSections(body.homepageSections);
    }

    for (const key of POLICY_KEYS) {
      if (body[key] === undefined) continue;
      const parsed = parsePolicy(body[key]);
      if (!parsed.data) {
        return NextResponse.json({ success: false, error: parsed.error || 'Invalid policy content.' }, { status: 400 });
      }
      updateData[key] = parsed.data;
    }

    if (body.affiliateProgram !== undefined) {
      const parsed = parseAffiliateProgram(body.affiliateProgram);
      if (!parsed.data) return NextResponse.json({ success: false, error: parsed.error || 'Invalid affiliate settings.' }, { status: 400 });
      updateData.affiliateProgram = parsed.data;
    }

    if (body.abandonedCartRecovery !== undefined) {
      const parsed = parseAbandonedCartRecovery(body.abandonedCartRecovery);
      if (!parsed.data) return NextResponse.json({ success: false, error: parsed.error || 'Invalid cart-recovery settings.' }, { status: 400 });
      const current = await getStorefrontSettings();
      updateData.abandonedCartRecovery = {
        ...parsed.data,
        enabledAt: parsed.data.enabled
          ? current.abandonedCartRecovery.enabledAt || new Date().toISOString()
          : null,
      };
    }

    return NextResponse.json({ success: true, data: await updateStorefrontSettings(updateData) });
  } catch (error) {
    console.error('Error updating storefront settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update storefront settings.' }, { status: 500 });
  }
}
