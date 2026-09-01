import type { AffiliateProgramSettings } from '@/types/storefrontSettings';

export function isAffiliateCommissionEligible(status: string, settings: AffiliateProgramSettings) {
  if (status === 'CANCELLED') return !settings.cancelledOrderClawback;
  if (status === 'RETURNED' || status === 'REFUNDED') return !settings.returnedOrderClawback;
  return settings.eligibleOrderStatuses.some((eligibleStatus) => eligibleStatus === status);
}

export function isAffiliateCommissionPending(status: string, settings: AffiliateProgramSettings) {
  return status !== 'CANCELLED' && !isAffiliateCommissionEligible(status, settings);
}
