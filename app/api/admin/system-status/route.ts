import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import {
  getNewsletterSettings,
  type EmailMarketingProvider,
} from '@/lib/newsletterSettings.server';
import { logError } from '@/lib/logger';
import { getStorefrontSettings } from '@/lib/storefrontSettings.server';

export const dynamic = 'force-dynamic';

const PROVIDER_REQUIREMENTS: Record<Exclude<EmailMarketingProvider, 'NONE'>, string[]> = {
  MAILCHIMP: ['MAILCHIMP_API_KEY', 'MAILCHIMP_LIST_ID'],
  BREVO: ['BREVO_API_KEY'],
  KLAVIYO: ['KLAVIYO_API_KEY', 'KLAVIYO_LIST_ID'],
};

function isConfigured(name: string) {
  return Boolean(process.env[name]?.trim());
}

function getMissing(names: string[]) {
  return names.filter((name) => !isConfigured(name));
}

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [newsletter, storefront] = await Promise.all([getNewsletterSettings(), getStorefrontSettings()]);
    const recovery = storefront.abandonedCartRecovery;
    const smtpCredentialsMissing = getMissing(['SMTP_USER', 'SMTP_PASS']);
    const smtpDeliveryEnabled =
      process.env.EMAIL_DELIVERY_ENABLED?.trim().toLowerCase() === 'true';
    const smtpConfigured =
      smtpDeliveryEnabled && smtpCredentialsMissing.length === 0;
    const smtpMissing = [
      ...(!smtpDeliveryEnabled
        ? ['EMAIL_DELIVERY_ENABLED=true after provider verification']
        : []),
      ...smtpCredentialsMissing,
    ];

    const selectedProvider = newsletter.provider;
    const providerRequirements =
      selectedProvider === 'NONE' ? [] : PROVIDER_REQUIREMENTS[selectedProvider];
    const providerMissing = getMissing(providerRequirements);
    const providerConfigured =
      selectedProvider !== 'NONE' && providerMissing.length === 0;

    const cronSecretConfigured = isConfigured('CRON_SECRET');
    const schedulerConfigured =
      process.env.ABANDONED_CART_CRON_CONFIGURED?.trim().toLowerCase() === 'true';
    const cronOperational =
      recovery.enabled && cronSecretConfigured && schedulerConfigured && smtpConfigured;

    const cronMissing = [
      ...(!recovery.enabled ? ['Enable cart recovery in admin'] : []),
      ...(!cronSecretConfigured ? ['CRON_SECRET'] : []),
      ...(!schedulerConfigured ? ['Production scheduler activation'] : []),
      ...(!smtpConfigured ? ['SMTP delivery credentials'] : []),
    ];

    const providerMissingItems =
      selectedProvider === 'NONE'
        ? ['Email marketing provider selection', 'Provider API credentials']
        : providerMissing;

    return NextResponse.json(
      {
        success: true,
        data: {
          mode:
            smtpConfigured || providerConfigured || cronOperational
              ? 'PARTIALLY_CONFIGURED'
              : 'PROVIDERLESS_TESTING',
          smtp: {
            status: smtpConfigured
              ? 'CONFIGURED'
              : smtpDeliveryEnabled
                ? 'CREDENTIALS_MISSING'
                : 'DISABLED',
            configured: smtpConfigured,
            deliveryEnabled: smtpDeliveryEnabled,
            credentialsPresent: smtpCredentialsMissing.length === 0,
            missing: smtpMissing,
            affectedFeatures: [
              'Account verification and password reset emails',
              'Order and affiliate workflow emails',
              'Marketing campaign delivery',
              'Abandoned-cart recovery emails',
            ],
          },
          marketing: {
            status:
              selectedProvider === 'NONE'
                ? 'NOT_SELECTED'
                : providerConfigured
                  ? 'CONFIGURED'
                  : 'CREDENTIALS_MISSING',
            selectedProvider,
            configured: providerConfigured,
            localSubscriberStorageOperational: true,
            missing: providerMissingItems,
          },
          cron: {
            status: cronOperational ? 'OPERATIONAL' : 'INACTIVE',
            operational: cronOperational,
            endpointProtected: cronSecretConfigured,
            schedulerConfigured,
            emailDeliveryReady: smtpConfigured,
            delayHours: recovery.delayHours,
            recoveryEnabled: recovery.enabled,
            missing: cronMissing,
          },
          pendingDocumentation: {
            file: 'Pending.md',
            reason:
              'No email service provider or SMTP credentials are currently available, so outbound email and its dependent cron job remain intentionally inactive.',
          },
          generatedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    logError('admin.system_status_failed', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to load email and cron status.' },
      { status: 500 },
    );
  }
}
