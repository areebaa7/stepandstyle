import prisma from '@/lib/prisma';
import { serializeStorefrontSettings } from '@/lib/storefrontSettings';
import type { StorefrontSettingsDTO } from '@/types/storefrontSettings';

export interface StorefrontSettingsUpdate {
  manualPaymentEnabled?: boolean;
  bankName?: string;
  bankAccountTitle?: string;
  bankAccountNumber?: string;
  bankIban?: string;
  easypaisaAccountTitle?: string;
  easypaisaAccountNumber?: string;
  jazzcashAccountTitle?: string;
  jazzcashAccountNumber?: string;
  manualPaymentInstructions?: string;
  supportEmail?: string;
  supportPhone?: string;
  whatsappUrl?: string;
  businessAddress?: string;
  returnAddress?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  shippingPolicy?: any;
  returnsPolicy?: any;
  privacyPolicy?: any;
  termsPolicy?: any;
  affiliateProgram?: any;
  abandonedCartRecovery?: any;
  bankTransferPopupEnabled?: boolean;
  bankTransferDiscountPercent?: number;
  bankTransferPopupTitle?: string;
  bankTransferPopupMessage?: string;
  homepageSections?: any;
}

const SETTINGS_ID = 'storefront_settings';

export async function getStorefrontSettings(): Promise<StorefrontSettingsDTO> {
  let settings = await prisma.storefrontSettings.findUnique({
    where: { id: SETTINGS_ID },
  });

  if (!settings) {
    settings = await prisma.storefrontSettings.create({
      data: {
        id: SETTINGS_ID,
      },
    });
  }

  return serializeStorefrontSettings(settings);
}

export async function updateStorefrontSettings(
  update: StorefrontSettingsUpdate,
): Promise<StorefrontSettingsDTO> {
  const settings = await prisma.storefrontSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      ...(update as any),
    },
    update: {
      ...(update as any),
      updatedAt: new Date(),
    },
  });

  return serializeStorefrontSettings(settings);
}