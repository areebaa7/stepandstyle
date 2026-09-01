export type HomepageSectionId =
  | 'MAIN_HERO'
  | 'TRENDING_PRODUCTS'
  | 'SALE'
  | 'WOMEN'
  | 'MEN'
  | 'KIDS'
  | 'TRUST_BANNER'
  | 'AFFILIATE'
  | 'REELS'
  | 'COMMUNITY'
  | 'REVIEWS';

export interface HomepageSectionSetting {
  id: HomepageSectionId;
  label: string;
  isVisible: boolean;
  order: number;
}

export type StorePolicyKey = 'shippingPolicy' | 'returnsPolicy' | 'privacyPolicy' | 'termsPolicy';

export interface StorePolicySection {
  id: string;
  heading: string;
  body: string;
}

export interface StorePolicyPage {
  title: string;
  summary: string;
  lastUpdated: string;
  sections: StorePolicySection[];
}

export type AffiliateEligibleOrderStatus = 'PAID' | 'SHIPPED' | 'COMPLETED';

export interface AffiliateCommissionTier {
  id: string;
  name: string;
  commissionPercent: number;
  qualification: string;
}

export interface AffiliateProgramSettings {
  enabled: boolean;
  defaultCommissionPercent: number;
  attributionDays: number;
  eligibleOrderStatuses: AffiliateEligibleOrderStatus[];
  cancelledOrderClawback: boolean;
  returnedOrderClawback: boolean;
  minimumPayoutPkr: number;
  payoutSchedule: string;
  payoutMethods: string[];
  tiers: AffiliateCommissionTier[];
  publicTerms: string[];
}

export interface AbandonedCartRecoverySettings {
  enabled: boolean;
  enabledAt: string | null;
  delayHours: number;
  subject: string;
  heading: string;
  message: string;
  ctaText: string;
}

export interface StorefrontSettingsDTO {
  manualPaymentEnabled: boolean;
  manualPaymentAvailable: boolean;
  bankName: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankIban: string;
  easypaisaAccountTitle: string;
  easypaisaAccountNumber: string;
  jazzcashAccountTitle: string;
  jazzcashAccountNumber: string;
  manualPaymentInstructions: string;
  supportEmail: string;
  supportPhone: string;
  whatsappUrl: string;
  businessAddress: string;
  returnAddress: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  shippingPolicy: StorePolicyPage;
  returnsPolicy: StorePolicyPage;
  privacyPolicy: StorePolicyPage;
  termsPolicy: StorePolicyPage;
  affiliateProgram: AffiliateProgramSettings;
  abandonedCartRecovery: AbandonedCartRecoverySettings;
  bankTransferPopupEnabled: boolean;
  bankTransferDiscountPercent: number;
  bankTransferPopupTitle: string;
  bankTransferPopupMessage: string;
  homepageSections: HomepageSectionSetting[];
}
