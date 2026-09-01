import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { normalizeNewsletterSettings } from '@/lib/newsletterSettings.server';

export async function GET() {
  try {
    const settings = await prisma.marketingSettings.findUnique({
      where: { id: 'marketing_settings' },
      select: {
        ga4MeasurementId: true,
        gtmContainerId: true,
        googleAdsConversionId: true,
        metaPixelId: true,
        metaPixelEnabled: true,
        newsletterPopupEnabled: true,
        newsletterPopupDelaySeconds: true,
        newsletterIncentiveEnabled: true,
        newsletterIncentiveText: true,
        emailMarketingProvider: true,
        wooCommerceSyncEnabled: true,
        newsletterConsentText: true,
        newsletterConsentVersion: true,
        privacyPolicyUrl: true,
      }
    });

    const newsletter = normalizeNewsletterSettings(settings);
    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        newsletter: {
          popupEnabled: newsletter.popupEnabled,
          popupDelaySeconds: newsletter.popupDelaySeconds,
          incentiveEnabled: newsletter.incentiveEnabled,
          incentiveText: newsletter.incentiveText,
          consentText: newsletter.consentText,
          consentVersion: newsletter.consentVersion,
          privacyPolicyUrl: newsletter.privacyPolicyUrl,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching public marketing settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}
