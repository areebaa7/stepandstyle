'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_STOREFRONT_SETTINGS } from '@/lib/storefrontSettings';
import type { AffiliateEligibleOrderStatus, AffiliateProgramSettings, StorefrontSettingsDTO } from '@/types/storefrontSettings';
import { AdminLoadingState, AdminNotice } from './AdminAsyncState';

const orderStatuses: Array<{ value: AffiliateEligibleOrderStatus; label: string }> = [
  { value: 'PAID', label: 'Payment approved' },
  { value: 'SHIPPED', label: 'Order shipped' },
  { value: 'COMPLETED', label: 'Order delivered/completed' },
];

export default function AdminAffiliateRulesPanel() {
  const [settings, setSettings] = useState<StorefrontSettingsDTO>(DEFAULT_STOREFRONT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const affiliate = settings.affiliateProgram;

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/admin/settings/storefront', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to load affiliate rules.');
        setSettings(payload.data);
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to load affiliate rules.' });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const update = (changes: Partial<AffiliateProgramSettings>) => {
    setSettings((current) => ({ ...current, affiliateProgram: { ...current.affiliateProgram, ...changes } }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/settings/storefront', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateProgram: affiliate }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to save affiliate rules.');
      setSettings(payload.data);
      setNotice({ type: 'success', message: 'Affiliate rules saved and published.' });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save affiliate rules.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <AdminLoadingState label="Loading affiliate rules..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Affiliate program</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">Commission &amp; Payout Rules</h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">These settings control new affiliate approvals, commission eligibility, and the public affiliate offer. Existing partner-specific commission overrides remain unchanged.</p>
      </div>
      {notice && <AdminNotice type={notice.type} message={notice.message} />}

      <form onSubmit={save} className="space-y-7">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="text-lg font-bold text-gray-900">Program availability</h3><p className="mt-1 text-sm text-gray-500">When disabled, new public applications are paused.</p></div>
            <Toggle checked={affiliate.enabled} label={affiliate.enabled ? 'Applications enabled' : 'Applications paused'} onChange={(enabled) => update({ enabled })} />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h3 className="text-lg font-bold text-gray-900">Default commission &amp; attribution</h3>
          <p className="mt-1 text-sm text-gray-500">The default commission applies to newly approved or directly created affiliates. Individual rates can still be changed from the partner profile.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <NumberField label="Default commission (%)" value={affiliate.defaultCommissionPercent} min={0} max={100} step={0.1} onChange={(defaultCommissionPercent) => update({ defaultCommissionPercent })} />
            <NumberField label="Attribution duration (days)" value={affiliate.attributionDays} min={1} max={365} step={1} onChange={(attributionDays) => update({ attributionDays })} />
            <NumberField label="Minimum payout (PKR)" value={affiliate.minimumPayoutPkr} min={0} max={100000000} step={100} onChange={(minimumPayoutPkr) => update({ minimumPayoutPkr })} />
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-gray-700">Commission becomes earned at these order statuses</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {orderStatuses.map((status) => (
                <label key={status.value} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                  <input type="checkbox" checked={affiliate.eligibleOrderStatuses.includes(status.value)} onChange={(event) => update({ eligibleOrderStatuses: event.target.checked ? [...affiliate.eligibleOrderStatuses, status.value] : affiliate.eligibleOrderStatuses.filter((item) => item !== status.value) })} className="h-4 w-4 accent-purple-600" />
                  {status.label}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ToggleCard title="Cancelled-order clawback" description="Remove commission when an attributed order is cancelled." checked={affiliate.cancelledOrderClawback} onChange={(cancelledOrderClawback) => update({ cancelledOrderClawback })} />
            <ToggleCard title="Returned/refunded clawback" description="Publish that returned or refunded orders lose commission." checked={affiliate.returnedOrderClawback} onChange={(returnedOrderClawback) => update({ returnedOrderClawback })} />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <h3 className="text-lg font-bold text-gray-900">Payout details</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField label="Payout schedule" value={affiliate.payoutSchedule} maxLength={120} onChange={(payoutSchedule) => update({ payoutSchedule })} />
            <label className="block space-y-2 text-sm font-semibold text-gray-700">Payout methods (one per line)<textarea required rows={4} value={affiliate.payoutMethods.join('\n')} onChange={(event) => update({ payoutMethods: event.target.value.split('\n') })} className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4"><div><h3 className="text-lg font-bold text-gray-900">Public commission tiers</h3><p className="mt-1 text-sm text-gray-500">These tiers appear on the public affiliate page.</p></div><button type="button" disabled={affiliate.tiers.length >= 10} onClick={() => update({ tiers: [...affiliate.tiers, { id: `tier-${crypto.randomUUID()}`, name: '', commissionPercent: affiliate.defaultCommissionPercent, qualification: '' }] })} className="rounded-xl bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 disabled:opacity-40">+ Add tier</button></div>
          <div className="mt-5 space-y-4">
            {affiliate.tiers.map((tier, index) => (
              <div key={tier.id} className="grid gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-[1fr_150px_1.3fr_auto] sm:items-end">
                <TextField label="Tier name" value={tier.name} maxLength={100} onChange={(name) => update({ tiers: affiliate.tiers.map((item, itemIndex) => itemIndex === index ? { ...item, name } : item) })} />
                <NumberField label="Commission (%)" value={tier.commissionPercent} min={0} max={100} step={0.1} onChange={(commissionPercent) => update({ tiers: affiliate.tiers.map((item, itemIndex) => itemIndex === index ? { ...item, commissionPercent } : item) })} />
                <TextField label="Qualification" value={tier.qualification} maxLength={240} onChange={(qualification) => update({ tiers: affiliate.tiers.map((item, itemIndex) => itemIndex === index ? { ...item, qualification } : item) })} />
                <button type="button" disabled={affiliate.tiers.length === 1} onClick={() => update({ tiers: affiliate.tiers.filter((_, itemIndex) => itemIndex !== index) })} className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold text-red-700 disabled:opacity-30">Remove</button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4"><div><h3 className="text-lg font-bold text-gray-900">Public program terms</h3><p className="mt-1 text-sm text-gray-500">Plain-text terms shown to applicants; HTML and scripts are not accepted.</p></div><button type="button" disabled={affiliate.publicTerms.length >= 20} onClick={() => update({ publicTerms: [...affiliate.publicTerms, ''] })} className="rounded-xl bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 disabled:opacity-40">+ Add term</button></div>
          <div className="mt-5 space-y-3">
            {affiliate.publicTerms.map((term, index) => (
              <div key={index} className="flex gap-3"><textarea required rows={2} maxLength={500} value={term} onChange={(event) => update({ publicTerms: affiliate.publicTerms.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} className="min-w-0 flex-1 resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /><button type="button" disabled={affiliate.publicTerms.length === 1} onClick={() => update({ publicTerms: affiliate.publicTerms.filter((_, itemIndex) => itemIndex !== index) })} className="self-start rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-xs font-bold text-red-700 disabled:opacity-30">Remove</button></div>
            ))}
          </div>
        </section>

        <button disabled={isSaving || affiliate.eligibleOrderStatuses.length === 0} className="w-full rounded-xl bg-purple-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Affiliate Rules'}</button>
      </form>
    </div>
  );
}

function TextField({ label, value, maxLength, onChange }: { label: string; value: string; maxLength: number; onChange: (value: string) => void }) { return <label className="block space-y-2 text-sm font-semibold text-gray-700">{label}<input required value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></label>; }
function NumberField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) { return <label className="block space-y-2 text-sm font-semibold text-gray-700">{label}<input required type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></label>; }
function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) { return <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-bold text-gray-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" /><span className="relative h-7 w-12 rounded-full bg-gray-300 transition peer-checked:bg-purple-600 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />{label}</label>; }
function ToggleCard({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) { return <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4"><div><p className="text-sm font-bold text-gray-900">{title}</p><p className="mt-1 text-xs leading-5 text-gray-500">{description}</p></div><Toggle checked={checked} label="" onChange={onChange} /></div>; }
