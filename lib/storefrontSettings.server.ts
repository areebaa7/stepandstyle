import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { serializeStorefrontSettings } from '@/lib/storefrontSettings';
import type { AbandonedCartRecoverySettings, AffiliateProgramSettings, HomepageSectionSetting, StorePolicyPage, StorefrontSettingsDTO } from '@/types/storefrontSettings';

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
  shippingPolicy?: StorePolicyPage;
  returnsPolicy?: StorePolicyPage;
  privacyPolicy?: StorePolicyPage;
  termsPolicy?: StorePolicyPage;
  affiliateProgram?: AffiliateProgramSettings;
  abandonedCartRecovery?: AbandonedCartRecoverySettings;
  bankTransferPopupEnabled?: boolean;
  bankTransferDiscountPercent?: number;
  bankTransferPopupTitle?: string;
  bankTransferPopupMessage?: string;
  homepageSections?: HomepageSectionSetting[];
}

const getFirstDocument = (result: unknown) => {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return null;
  const cursor = (result as Record<string, unknown>).cursor;
  if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor)) return null;
  const firstBatch = (cursor as Record<string, unknown>).firstBatch;
  return Array.isArray(firstBatch) && firstBatch[0] && typeof firstBatch[0] === 'object'
    ? firstBatch[0] as Record<string, unknown>
    : null;
};

export async function getStorefrontSettings(): Promise<StorefrontSettingsDTO> {
  const result = await prisma.$runCommandRaw({
    find: 'StorefrontSettings',
    filter: { _id: 'storefront_settings' },
    limit: 1,
  });
  return serializeStorefrontSettings(getFirstDocument(result));
}

export async function updateStorefrontSettings(
  update: StorefrontSettingsUpdate,
): Promise<StorefrontSettingsDTO> {
  const documentUpdate = update as unknown as Prisma.InputJsonObject;
  await prisma.$runCommandRaw({
    update: 'StorefrontSettings',
    updates: [
      {
        q: { _id: 'storefront_settings' },
        u: {
          $set: {
            ...documentUpdate,
            updatedAt: { $date: new Date().toISOString() },
          },
          $setOnInsert: {
            _id: 'storefront_settings',
          },
        },
        upsert: true,
      },
    ],
  });

  return getStorefrontSettings();
}
