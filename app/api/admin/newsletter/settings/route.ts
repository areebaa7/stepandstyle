import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';
import {
  DEFAULT_NEWSLETTER_SETTINGS,
  normalizeNewsletterSettings,
  type EmailMarketingProvider,
} from '@/lib/newsletterSettings.server';

const PROVIDERS = new Set<EmailMarketingProvider>(['NONE', 'MAILCHIMP', 'BREVO', 'KLAVIYO']);

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await prisma.marketingSettings.findUnique({
      where: { id: 'marketing_settings' },
    });
    return NextResponse.json({
      success: true,
      data: normalizeNewsletterSettings(settings),
      integrations: {
        mailchimp: Boolean(process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_LIST_ID),
        brevo: Boolean(process.env.BREVO_API_KEY),
        klaviyo: Boolean(process.env.KLAVIYO_API_KEY && process.env.KLAVIYO_LIST_ID),
        wooCommerce: Boolean(
          process.env.WOOCOMMERCE_URL &&
          process.env.WOOCOMMERCE_CONSUMER_KEY &&
          process.env.WOOCOMMERCE_CONSUMER_SECRET
        ),
      },
    });
  } catch (error) {
    console.error('Failed to load newsletter settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to load settings.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const input = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
    const provider = String(input.provider || 'NONE').toUpperCase() as EmailMarketingProvider;
    const popupDelaySeconds = Number(input.popupDelaySeconds);

    if (!PROVIDERS.has(provider)) {
      return NextResponse.json({ success: false, error: 'Invalid email provider.' }, { status: 400 });
    }
    if (!Number.isInteger(popupDelaySeconds) || popupDelaySeconds < 5 || popupDelaySeconds > 300) {
      return NextResponse.json({ success: false, error: 'Popup delay must be between 5 and 300 seconds.' }, { status: 400 });
    }

    const consentText = String(input.consentText || '').trim();
    const consentVersion = String(input.consentVersion || '').trim();
    const privacyPolicyUrl = String(input.privacyPolicyUrl || '').trim();
    if (!consentText || !consentVersion || !privacyPolicyUrl) {
      return NextResponse.json({ success: false, error: 'Consent text, version and privacy URL are required.' }, { status: 400 });
    }

    const data = {
      newsletterPopupEnabled: input.popupEnabled === true,
      newsletterPopupDelaySeconds: popupDelaySeconds,
      newsletterIncentiveEnabled: input.incentiveEnabled === true,
      newsletterIncentiveText:
        String(input.incentiveText || '').trim() || DEFAULT_NEWSLETTER_SETTINGS.incentiveText,
      newsletterDiscountCode: String(input.discountCode || '').trim().toUpperCase() || null,
      emailMarketingProvider: provider,
      wooCommerceSyncEnabled: input.wooCommerceSyncEnabled === true,
      newsletterConsentText: consentText.slice(0, 500),
      newsletterConsentVersion: consentVersion.slice(0, 50),
      privacyPolicyUrl: privacyPolicyUrl.slice(0, 300),
    };

    const settings = await prisma.marketingSettings.upsert({
      where: { id: 'marketing_settings' },
      update: data,
      create: { id: 'marketing_settings', ...data },
    });
    return NextResponse.json({ success: true, data: normalizeNewsletterSettings(settings) });
  } catch (error) {
    console.error('Failed to update newsletter settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings.' }, { status: 500 });
  }
}
