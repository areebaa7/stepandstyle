import prisma from '@/lib/prisma';

export const DEFAULT_NEWSLETTER_SETTINGS = {
  popupEnabled: true,
  popupDelaySeconds: 20,
  incentiveEnabled: false,
  incentiveText: 'Join our list for private offers and new arrivals.',
  discountCode: '',
  provider: 'NONE',
  wooCommerceSyncEnabled: false,
  consentText: 'I agree to receive marketing emails from Step & Styl. I can unsubscribe at any time.',
  consentVersion: '2026-01',
  privacyPolicyUrl: '/privacy-policy',
} as const;

export type EmailMarketingProvider = 'NONE' | 'MAILCHIMP' | 'BREVO' | 'KLAVIYO';

export interface NewsletterSettings {
  popupEnabled: boolean;
  popupDelaySeconds: number;
  incentiveEnabled: boolean;
  incentiveText: string;
  discountCode: string;
  provider: EmailMarketingProvider;
  wooCommerceSyncEnabled: boolean;
  consentText: string;
  consentVersion: string;
  privacyPolicyUrl: string;
}

const PROVIDERS = new Set<EmailMarketingProvider>(['NONE', 'MAILCHIMP', 'BREVO', 'KLAVIYO']);

export function normalizeNewsletterSettings(
  value: {
    newsletterPopupEnabled?: boolean | null;
    newsletterPopupDelaySeconds?: number | null;
    newsletterIncentiveEnabled?: boolean | null;
    newsletterIncentiveText?: string | null;
    newsletterDiscountCode?: string | null;
    emailMarketingProvider?: string | null;
    wooCommerceSyncEnabled?: boolean | null;
    newsletterConsentText?: string | null;
    newsletterConsentVersion?: string | null;
    privacyPolicyUrl?: string | null;
  } | null,
): NewsletterSettings {
  const provider = String(value?.emailMarketingProvider || 'NONE').toUpperCase() as EmailMarketingProvider;

  return {
    popupEnabled: value?.newsletterPopupEnabled ?? DEFAULT_NEWSLETTER_SETTINGS.popupEnabled,
    popupDelaySeconds: Math.min(
      300,
      Math.max(5, Number(value?.newsletterPopupDelaySeconds ?? DEFAULT_NEWSLETTER_SETTINGS.popupDelaySeconds)),
    ),
    incentiveEnabled: value?.newsletterIncentiveEnabled ?? DEFAULT_NEWSLETTER_SETTINGS.incentiveEnabled,
    incentiveText: value?.newsletterIncentiveText?.trim() || DEFAULT_NEWSLETTER_SETTINGS.incentiveText,
    discountCode: value?.newsletterDiscountCode?.trim().toUpperCase() || '',
    provider: PROVIDERS.has(provider) ? provider : 'NONE',
    wooCommerceSyncEnabled:
      value?.wooCommerceSyncEnabled ?? DEFAULT_NEWSLETTER_SETTINGS.wooCommerceSyncEnabled,
    consentText: value?.newsletterConsentText?.trim() || DEFAULT_NEWSLETTER_SETTINGS.consentText,
    consentVersion:
      value?.newsletterConsentVersion?.trim() || DEFAULT_NEWSLETTER_SETTINGS.consentVersion,
    privacyPolicyUrl: value?.privacyPolicyUrl?.trim() || DEFAULT_NEWSLETTER_SETTINGS.privacyPolicyUrl,
  };
}

export async function getNewsletterSettings(): Promise<NewsletterSettings> {
  const settings = await prisma.marketingSettings.findUnique({
    where: { id: 'marketing_settings' },
    select: {
      newsletterPopupEnabled: true,
      newsletterPopupDelaySeconds: true,
      newsletterIncentiveEnabled: true,
      newsletterIncentiveText: true,
      newsletterDiscountCode: true,
      emailMarketingProvider: true,
      wooCommerceSyncEnabled: true,
      newsletterConsentText: true,
      newsletterConsentVersion: true,
      privacyPolicyUrl: true,
    },
  });

  return normalizeNewsletterSettings(settings);
}
