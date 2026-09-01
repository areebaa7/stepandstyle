import type {
  AbandonedCartRecoverySettings,
  AffiliateEligibleOrderStatus,
  AffiliateProgramSettings,
  HomepageSectionId,
  HomepageSectionSetting,
  StorePolicyKey,
  StorePolicyPage,
  StorefrontSettingsDTO,
} from '@/types/storefrontSettings';

export const DEFAULT_ABANDONED_CART_RECOVERY: AbandonedCartRecoverySettings = {
  enabled: false,
  enabledAt: null,
  delayHours: 2,
  subject: 'You left something stylish behind',
  heading: 'Your cart is waiting',
  message: 'Your selected Step & Styl items are still waiting for you. Your saved cart total is {{cartTotal}}.',
  ctaText: 'Return to Cart',
};

export const DEFAULT_AFFILIATE_PROGRAM: AffiliateProgramSettings = {
  enabled: true,
  defaultCommissionPercent: 10,
  attributionDays: 30,
  eligibleOrderStatuses: ['COMPLETED'],
  cancelledOrderClawback: true,
  returnedOrderClawback: true,
  minimumPayoutPkr: 3000,
  payoutSchedule: 'Monthly',
  payoutMethods: ['Bank transfer', 'JazzCash', 'Easypaisa'],
  tiers: [
    { id: 'standard', name: 'Standard affiliate', commissionPercent: 10, qualification: 'All newly approved affiliates' },
  ],
  publicTerms: [
    'Commission is earned only when an attributed order reaches an eligible order status.',
    'Fake, self-referred, misleading, or abusive activity may result in suspension and withheld commission.',
    'Cancelled, returned, or refunded orders may have their commission reversed according to the configured clawback rules.',
    'Payouts are processed after the minimum threshold and verification requirements are met.',
  ],
};

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionSetting[] = [
  { id: 'MAIN_HERO', label: 'Main Hero', isVisible: true, order: 0 },
  { id: 'TRENDING_PRODUCTS', label: 'Trending Products', isVisible: true, order: 1 },
  { id: 'SALE', label: 'Sale Banner & Products', isVisible: true, order: 2 },
  { id: 'WOMEN', label: "Women's Collection", isVisible: true, order: 3 },
  { id: 'MEN', label: "Men's Collection", isVisible: true, order: 4 },
  { id: 'KIDS', label: "Kids' Collection", isVisible: true, order: 5 },
  { id: 'TRUST_BANNER', label: 'Trust Indicators', isVisible: true, order: 6 },
  { id: 'AFFILIATE', label: 'Affiliate Promotion', isVisible: true, order: 7 },
  { id: 'REELS', label: 'Reels & Short Videos', isVisible: true, order: 8 },
  { id: 'COMMUNITY', label: 'Customer Community Media', isVisible: true, order: 9 },
  { id: 'REVIEWS', label: 'Customer Reviews', isVisible: true, order: 10 },
];

export const DEFAULT_STORE_POLICIES: Record<StorePolicyKey, StorePolicyPage> = {
  shippingPolicy: {
    title: 'Shipping & Delivery',
    summary: 'Information about delivery charges, estimated times, order updates, and receiving your parcel.',
    lastUpdated: '2026-08-01',
    sections: [
      { id: 'shipping-rates', heading: 'Shipping rates', body: 'Shipping charges are calculated using the configured region and city rates shown at checkout. The final delivery charge is displayed before an order is submitted.' },
      { id: 'delivery-times', heading: 'Estimated delivery times', body: 'Orders for major cities usually arrive within 2 to 3 working days. Other regions may require 4 to 6 working days. These are estimates and may change because of courier, weather, holiday, or access delays.' },
      { id: 'order-updates', heading: 'Order and tracking updates', body: 'Order status updates are available through your account. Courier and tracking information will be shown or shared when it has been assigned to the order.' },
      { id: 'receiving-orders', heading: 'Receiving your order', body: 'Please provide an accurate address and phone number and ensure someone is available to receive the parcel. For cash-on-delivery orders, keep the payable amount ready for the courier.' },
    ],
  },
  returnsPolicy: {
    title: 'Returns & Exchanges',
    summary: 'How to request a return, exchange, or refund for an eligible order.',
    lastUpdated: '2026-08-01',
    sections: [
      { id: 'request-process', heading: 'Request process', body: 'Contact support as soon as possible after receiving the order. Provide the order reference, reason for the request, and clear photographs where the item is damaged or faulty. Wait for return instructions before sending anything back.' },
      { id: 'eligibility', heading: 'Eligibility', body: 'Items must be unused, unworn, and returned with their original packaging and tags. Eligibility may depend on the reported issue, the item condition, and the approved return period.' },
      { id: 'non-returnable', heading: 'Non-returnable items', body: 'Final-sale, clearance, customized, personalized, used, damaged-after-delivery, or incomplete items may be excluded from return or exchange.' },
      { id: 'exchanges', heading: 'Exchanges', body: 'Eligible size or product exchanges are processed after the returned item is received and inspected. Replacement availability cannot be guaranteed until the inspection is complete.' },
      { id: 'refunds', heading: 'Refunds', body: 'Approved refunds are processed using the available business-approved method after inspection. Bank, wallet, courier, or payment-provider processing times may apply.' },
    ],
  },
  privacyPolicy: {
    title: 'Privacy Policy',
    summary: 'How Step & Styl collects, uses, stores, and protects customer information.',
    lastUpdated: '2026-08-01',
    sections: [
      { id: 'information-collected', heading: 'Information we collect', body: 'We collect information you provide when placing an order, creating an account, contacting support, applying to the affiliate program, or choosing to receive marketing messages. This may include contact, delivery, order, and account information.' },
      { id: 'information-use', heading: 'How information is used', body: 'Information is used to provide accounts, process and fulfil orders, review payments, support customers, prevent abuse, improve the store, and meet legal or operational requirements.' },
      { id: 'marketing', heading: 'Marketing communications', body: 'Promotional messages are sent only where the required consent has been recorded. You may unsubscribe using the link provided in a marketing email.' },
      { id: 'service-providers', heading: 'Service providers', body: 'When enabled, selected providers process the minimum information required for services such as hosting, storage, analytics, email delivery, marketing, payment processing, and fulfilment.' },
      { id: 'retention-security', heading: 'Retention and security', body: 'Records are retained for business, security, consent, and legal purposes. Reasonable technical and organizational safeguards are used, but no internet service can guarantee absolute security.' },
      { id: 'privacy-contact', heading: 'Privacy requests', body: 'Use the current contact details published in the Help Center to ask a privacy question or request assistance concerning your information.' },
    ],
  },
  termsPolicy: {
    title: 'Terms & Conditions',
    summary: 'The basic terms that apply when using the Step & Styl website and placing an order.',
    lastUpdated: '2026-08-01',
    sections: [
      { id: 'using-store', heading: 'Using the store', body: 'You must provide accurate information, use the website lawfully, and avoid activity that disrupts the service, violates another person’s rights, or attempts unauthorized access.' },
      { id: 'orders-pricing', heading: 'Orders and pricing', body: 'Submitting an order is a request to purchase. An order may be reviewed, accepted, rejected, or cancelled where information is incomplete, stock is unavailable, pricing is incorrect, payment cannot be verified, or fraud is suspected.' },
      { id: 'payments', heading: 'Payments', body: 'Only payment methods displayed at checkout are available. Manual-transfer orders require a valid receipt and remain pending until reviewed. Never send payment to details that are not displayed by the official store.' },
      { id: 'availability', heading: 'Products and availability', body: 'Product colors, appearance, packaging, and availability may vary. We aim to keep descriptions and stock accurate and will address material errors when identified.' },
      { id: 'returns', heading: 'Returns, exchanges, and refunds', body: 'The current Returns & Exchanges policy forms part of these terms and describes eligibility, exclusions, inspection, replacements, and refunds.' },
      { id: 'changes-contact', heading: 'Changes and contact', body: 'These terms may be updated when the store, law, or business process changes. The latest published version applies from its displayed update date. Use the Help Center for questions.' },
    ],
  },
};

const SECTION_IDS = new Set<HomepageSectionId>(DEFAULT_HOMEPAGE_SECTIONS.map((section) => section.id));

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettingsDTO = {
  manualPaymentEnabled: false,
  manualPaymentAvailable: false,
  bankName: '',
  bankAccountTitle: '',
  bankAccountNumber: '',
  bankIban: '',
  easypaisaAccountTitle: '',
  easypaisaAccountNumber: '',
  jazzcashAccountTitle: '',
  jazzcashAccountNumber: '',
  manualPaymentInstructions: '',
  supportEmail: '',
  supportPhone: '',
  whatsappUrl: '',
  businessAddress: '',
  returnAddress: '',
  facebookUrl: '',
  instagramUrl: '',
  tiktokUrl: '',
  youtubeUrl: '',
  shippingPolicy: DEFAULT_STORE_POLICIES.shippingPolicy,
  returnsPolicy: DEFAULT_STORE_POLICIES.returnsPolicy,
  privacyPolicy: DEFAULT_STORE_POLICIES.privacyPolicy,
  termsPolicy: DEFAULT_STORE_POLICIES.termsPolicy,
  affiliateProgram: DEFAULT_AFFILIATE_PROGRAM,
  abandonedCartRecovery: DEFAULT_ABANDONED_CART_RECOVERY,
  bankTransferPopupEnabled: true,
  bankTransferDiscountPercent: 5,
  bankTransferPopupTitle: 'Save 5% with Bank Transfer',
  bankTransferPopupMessage: 'Enjoy extra 5% discount with direct bank transfer.',
  homepageSections: DEFAULT_HOMEPAGE_SECTIONS,
};

export function hasManualPaymentDestination(settings: {
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIban?: string | null;
  easypaisaAccountNumber?: string | null;
  jazzcashAccountNumber?: string | null;
}) {
  const bankConfigured = Boolean(
    settings.bankName?.trim()
      && (settings.bankAccountNumber?.trim() || settings.bankIban?.trim()),
  );
  return bankConfigured
    || Boolean(settings.easypaisaAccountNumber?.trim())
    || Boolean(settings.jazzcashAccountNumber?.trim());
}

export function normalizeStorePolicy(value: unknown, fallback: StorePolicyPage): StorePolicyPage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const candidate = value as Record<string, unknown>;
  const sections = Array.isArray(candidate.sections)
    ? candidate.sections.slice(0, 20).flatMap((entry, index) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
        const section = entry as Record<string, unknown>;
        const heading = typeof section.heading === 'string' ? section.heading.trim() : '';
        const body = typeof section.body === 'string' ? section.body.trim() : '';
        if (!heading || !body) return [];
        const rawId = typeof section.id === 'string' ? section.id.trim() : '';
        const id = /^[A-Za-z0-9_-]{1,80}$/.test(rawId) ? rawId : `section-${index + 1}`;
        return [{ id, heading, body }];
      })
    : [];
  const candidateDate = typeof candidate.lastUpdated === 'string' ? candidate.lastUpdated : '';
  const dateParts = /^\d{4}-\d{2}-\d{2}$/.test(candidateDate) ? candidateDate.split('-').map(Number) : [];
  const parsedDate = dateParts.length === 3 ? new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])) : null;
  const lastUpdated = parsedDate
    && parsedDate.getUTCFullYear() === dateParts[0]
    && parsedDate.getUTCMonth() === dateParts[1] - 1
    && parsedDate.getUTCDate() === dateParts[2]
    ? candidateDate
    : fallback.lastUpdated;
  return {
    title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title.trim() : fallback.title,
    summary: typeof candidate.summary === 'string' && candidate.summary.trim() ? candidate.summary.trim() : fallback.summary,
    lastUpdated,
    sections: sections.length ? sections : fallback.sections,
  };
}

export function normalizeHomepageSections(value: unknown): HomepageSectionSetting[] {
  const provided = Array.isArray(value) ? value : [];
  const parsed = new Map<HomepageSectionId, HomepageSectionSetting>();

  provided.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return;
    const item = entry as Record<string, unknown>;
    if (typeof item.id !== 'string' || !SECTION_IDS.has(item.id as HomepageSectionId)) return;
    const id = item.id as HomepageSectionId;
    const fallback = DEFAULT_HOMEPAGE_SECTIONS.find((section) => section.id === id)!;
    parsed.set(id, {
      id,
      label: fallback.label,
      isVisible: typeof item.isVisible === 'boolean' ? item.isVisible : true,
      order: Number.isInteger(Number(item.order)) ? Number(item.order) : index,
    });
  });

  DEFAULT_HOMEPAGE_SECTIONS.forEach((section) => {
    if (!parsed.has(section.id)) parsed.set(section.id, { ...section });
  });

  return Array.from(parsed.values())
    .sort((a, b) => a.order - b.order)
    .map((section, order) => ({ ...section, order }));
}

const AFFILIATE_ORDER_STATUSES = new Set<AffiliateEligibleOrderStatus>(['PAID', 'SHIPPED', 'COMPLETED']);

export function normalizeAffiliateProgram(value: unknown): AffiliateProgramSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_AFFILIATE_PROGRAM;
  const candidate = value as Record<string, unknown>;
  const statuses = Array.isArray(candidate.eligibleOrderStatuses)
    ? candidate.eligibleOrderStatuses.filter((status): status is AffiliateEligibleOrderStatus => (
        typeof status === 'string' && AFFILIATE_ORDER_STATUSES.has(status as AffiliateEligibleOrderStatus)
      ))
    : [];
  const methods = Array.isArray(candidate.payoutMethods)
    ? candidate.payoutMethods.filter((method): method is string => typeof method === 'string' && Boolean(method.trim())).slice(0, 10).map((method) => method.trim())
    : [];
  const tiers = Array.isArray(candidate.tiers)
    ? candidate.tiers.slice(0, 10).flatMap((entry, index) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
        const tier = entry as Record<string, unknown>;
        const name = typeof tier.name === 'string' ? tier.name.trim() : '';
        const qualification = typeof tier.qualification === 'string' ? tier.qualification.trim() : '';
        const commissionPercent = Number(tier.commissionPercent);
        if (!name || !qualification || !Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) return [];
        const rawId = typeof tier.id === 'string' ? tier.id.trim() : '';
        return [{ id: /^[A-Za-z0-9_-]{1,80}$/.test(rawId) ? rawId : `tier-${index + 1}`, name, commissionPercent, qualification }];
      })
    : [];
  const publicTerms = Array.isArray(candidate.publicTerms)
    ? candidate.publicTerms.filter((term): term is string => typeof term === 'string' && Boolean(term.trim())).slice(0, 20).map((term) => term.trim())
    : [];
  const defaultCommissionPercent = Number(candidate.defaultCommissionPercent);
  const attributionDays = Number(candidate.attributionDays);
  const minimumPayoutPkr = Number(candidate.minimumPayoutPkr);
  return {
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : DEFAULT_AFFILIATE_PROGRAM.enabled,
    defaultCommissionPercent: Number.isFinite(defaultCommissionPercent) && defaultCommissionPercent >= 0 && defaultCommissionPercent <= 100 ? defaultCommissionPercent : DEFAULT_AFFILIATE_PROGRAM.defaultCommissionPercent,
    attributionDays: Number.isInteger(attributionDays) && attributionDays >= 1 && attributionDays <= 365 ? attributionDays : DEFAULT_AFFILIATE_PROGRAM.attributionDays,
    eligibleOrderStatuses: statuses.length ? Array.from(new Set(statuses)) : DEFAULT_AFFILIATE_PROGRAM.eligibleOrderStatuses,
    cancelledOrderClawback: typeof candidate.cancelledOrderClawback === 'boolean' ? candidate.cancelledOrderClawback : DEFAULT_AFFILIATE_PROGRAM.cancelledOrderClawback,
    returnedOrderClawback: typeof candidate.returnedOrderClawback === 'boolean' ? candidate.returnedOrderClawback : DEFAULT_AFFILIATE_PROGRAM.returnedOrderClawback,
    minimumPayoutPkr: Number.isFinite(minimumPayoutPkr) && minimumPayoutPkr >= 0 && minimumPayoutPkr <= 100000000 ? minimumPayoutPkr : DEFAULT_AFFILIATE_PROGRAM.minimumPayoutPkr,
    payoutSchedule: typeof candidate.payoutSchedule === 'string' && candidate.payoutSchedule.trim() ? candidate.payoutSchedule.trim() : DEFAULT_AFFILIATE_PROGRAM.payoutSchedule,
    payoutMethods: methods.length ? Array.from(new Set(methods)) : DEFAULT_AFFILIATE_PROGRAM.payoutMethods,
    tiers: tiers.length ? tiers : DEFAULT_AFFILIATE_PROGRAM.tiers,
    publicTerms: publicTerms.length ? publicTerms : DEFAULT_AFFILIATE_PROGRAM.publicTerms,
  };
}

export function normalizeAbandonedCartRecovery(value: unknown): AbandonedCartRecoverySettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_ABANDONED_CART_RECOVERY;
  const candidate = value as Record<string, unknown>;
  const delayHours = Number(candidate.delayHours);
  const text = (field: 'subject' | 'heading' | 'message' | 'ctaText') => (
    typeof candidate[field] === 'string' && candidate[field].trim()
      ? candidate[field].trim()
      : DEFAULT_ABANDONED_CART_RECOVERY[field]
  );
  return {
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : DEFAULT_ABANDONED_CART_RECOVERY.enabled,
    enabledAt: typeof candidate.enabledAt === 'string' && !Number.isNaN(Date.parse(candidate.enabledAt)) ? candidate.enabledAt : null,
    delayHours: Number.isInteger(delayHours) && delayHours >= 1 && delayHours <= 168 ? delayHours : DEFAULT_ABANDONED_CART_RECOVERY.delayHours,
    subject: text('subject'),
    heading: text('heading'),
    message: text('message'),
    ctaText: text('ctaText'),
  };
}

export function serializeStorefrontSettings(settings?: {
  manualPaymentEnabled?: boolean | null;
  bankName?: string | null;
  bankAccountTitle?: string | null;
  bankAccountNumber?: string | null;
  bankIban?: string | null;
  easypaisaAccountTitle?: string | null;
  easypaisaAccountNumber?: string | null;
  jazzcashAccountTitle?: string | null;
  jazzcashAccountNumber?: string | null;
  manualPaymentInstructions?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  whatsappUrl?: string | null;
  businessAddress?: string | null;
  returnAddress?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  shippingPolicy?: unknown;
  returnsPolicy?: unknown;
  privacyPolicy?: unknown;
  termsPolicy?: unknown;
  affiliateProgram?: unknown;
  abandonedCartRecovery?: unknown;
  bankTransferPopupEnabled?: boolean | null;
  bankTransferDiscountPercent?: number | null;
  bankTransferPopupTitle?: string | null;
  bankTransferPopupMessage?: string | null;
  homepageSections?: unknown;
} | null): StorefrontSettingsDTO {
  const manualPaymentEnabled = settings?.manualPaymentEnabled ?? DEFAULT_STOREFRONT_SETTINGS.manualPaymentEnabled;
  const paymentDetails = {
    bankName: settings?.bankName?.trim() || '',
    bankAccountTitle: settings?.bankAccountTitle?.trim() || '',
    bankAccountNumber: settings?.bankAccountNumber?.trim() || '',
    bankIban: settings?.bankIban?.trim() || '',
    easypaisaAccountTitle: settings?.easypaisaAccountTitle?.trim() || '',
    easypaisaAccountNumber: settings?.easypaisaAccountNumber?.trim() || '',
    jazzcashAccountTitle: settings?.jazzcashAccountTitle?.trim() || '',
    jazzcashAccountNumber: settings?.jazzcashAccountNumber?.trim() || '',
    manualPaymentInstructions: settings?.manualPaymentInstructions?.trim() || '',
    supportEmail: settings?.supportEmail?.trim() || '',
    supportPhone: settings?.supportPhone?.trim() || '',
    whatsappUrl: settings?.whatsappUrl?.trim() || '',
    businessAddress: settings?.businessAddress?.trim() || '',
    returnAddress: settings?.returnAddress?.trim() || '',
    facebookUrl: settings?.facebookUrl?.trim() || '',
    instagramUrl: settings?.instagramUrl?.trim() || '',
    tiktokUrl: settings?.tiktokUrl?.trim() || '',
    youtubeUrl: settings?.youtubeUrl?.trim() || '',
  };
  return {
    manualPaymentEnabled,
    manualPaymentAvailable: manualPaymentEnabled && hasManualPaymentDestination(paymentDetails),
    ...paymentDetails,
    shippingPolicy: normalizeStorePolicy(settings?.shippingPolicy, DEFAULT_STORE_POLICIES.shippingPolicy),
    returnsPolicy: normalizeStorePolicy(settings?.returnsPolicy, DEFAULT_STORE_POLICIES.returnsPolicy),
    privacyPolicy: normalizeStorePolicy(settings?.privacyPolicy, DEFAULT_STORE_POLICIES.privacyPolicy),
    termsPolicy: normalizeStorePolicy(settings?.termsPolicy, DEFAULT_STORE_POLICIES.termsPolicy),
    affiliateProgram: normalizeAffiliateProgram(settings?.affiliateProgram),
    abandonedCartRecovery: normalizeAbandonedCartRecovery(settings?.abandonedCartRecovery),
    bankTransferPopupEnabled: settings?.bankTransferPopupEnabled ?? DEFAULT_STOREFRONT_SETTINGS.bankTransferPopupEnabled,
    bankTransferDiscountPercent: Number(settings?.bankTransferDiscountPercent ?? DEFAULT_STOREFRONT_SETTINGS.bankTransferDiscountPercent),
    bankTransferPopupTitle: settings?.bankTransferPopupTitle || DEFAULT_STOREFRONT_SETTINGS.bankTransferPopupTitle,
    bankTransferPopupMessage: settings?.bankTransferPopupMessage || DEFAULT_STOREFRONT_SETTINGS.bankTransferPopupMessage,
    homepageSections: normalizeHomepageSections(settings?.homepageSections),
  };
}
