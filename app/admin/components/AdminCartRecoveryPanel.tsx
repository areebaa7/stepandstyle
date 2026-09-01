'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_STOREFRONT_SETTINGS } from '@/lib/storefrontSettings';
import type { AbandonedCartRecoverySettings, StorefrontSettingsDTO } from '@/types/storefrontSettings';
import { AdminLoadingState, AdminNotice } from './AdminAsyncState';

export default function AdminCartRecoveryPanel() {
  const [settings, setSettings] = useState<StorefrontSettingsDTO>(DEFAULT_STOREFRONT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const recovery = settings.abandonedCartRecovery;

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/admin/settings/storefront', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to load cart-recovery settings.');
        setSettings(payload.data);
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to load cart-recovery settings.' });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const update = (changes: Partial<AbandonedCartRecoverySettings>) => {
    setSettings((current) => ({ ...current, abandonedCartRecovery: { ...current.abandonedCartRecovery, ...changes } }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/settings/storefront', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abandonedCartRecovery: recovery }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to save cart-recovery settings.');
      setSettings(payload.data);
      setNotice({ type: 'success', message: payload.data.abandonedCartRecovery.enabled ? 'Cart recovery enabled and settings saved.' : 'Cart recovery remains safely paused; settings saved.' });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save cart-recovery settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <AdminLoadingState label="Loading cart-recovery settings..." />;

  const previewMessage = recovery.message.replaceAll('{{cartTotal}}', 'Rs. 8,500.00');

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Customer recovery</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-950">Abandoned Cart Reminders</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">Configure when a saved customer cart becomes eligible and what its reminder email says. Real delivery still requires verified SMTP, a protected cron secret, and an active production scheduler.</p>
      </div>
      {notice && <AdminNotice type={notice.type} message={notice.message} />}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <form onSubmit={save} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="font-bold text-gray-950">Recovery capture and reminders</h3><p className="mt-1 text-sm text-gray-500">Keep this off until transactional email and the scheduler are ready.</p></div>
            <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-bold text-gray-700"><input type="checkbox" checked={recovery.enabled} onChange={(event) => update({ enabled: event.target.checked })} className="peer sr-only" /><span className="relative h-7 w-12 rounded-full bg-gray-300 transition peer-checked:bg-purple-600 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />{recovery.enabled ? 'Enabled' : 'Paused'}</label>
          </div>

          <label className="block space-y-2 text-sm font-bold text-gray-700">Send after inactivity (hours)<input required type="number" min={1} max={168} step={1} value={recovery.delayHours} onChange={(event) => update({ delayHours: Number(event.target.value) })} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /><span className="block text-xs font-normal leading-5 text-gray-500">Allowed range: 1 hour to 7 days. The cron may send later depending on its schedule.</span></label>

          <TextField label="Email subject" value={recovery.subject} maxLength={160} onChange={(subject) => update({ subject })} />
          <TextField label="Email heading" value={recovery.heading} maxLength={120} onChange={(heading) => update({ heading })} />
          <label className="block space-y-2 text-sm font-bold text-gray-700">Email message<textarea required rows={6} value={recovery.message} maxLength={1000} onChange={(event) => update({ message: event.target.value })} className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 leading-6 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /><span className="block text-xs font-normal leading-5 text-gray-500">Use <code className="rounded bg-gray-100 px-1.5 py-0.5">{'{{cartTotal}}'}</code> where the customer&apos;s saved cart total should appear. Text is safely escaped in email HTML.</span></label>
          <TextField label="Button text" value={recovery.ctaText} maxLength={80} onChange={(ctaText) => update({ ctaText })} />

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900"><strong>Safety:</strong> Enabling this switch does not bypass email or scheduler configuration. A reminder is marked sent only after the email delivery function confirms success.</div>
          <button disabled={isSaving} className="w-full rounded-xl bg-purple-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Cart Recovery Settings'}</button>
        </form>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <p className="mb-3 text-sm font-bold text-gray-700">Email preview</p>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Subject</p><p className="mt-1 break-words text-sm font-bold text-gray-900">{recovery.subject}</p></div>
            <div className="p-7 text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-purple-600">Step &amp; Styl</p><h3 className="mt-5 text-2xl font-bold text-gray-950">{recovery.heading}</h3><p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600">{previewMessage}</p><span className="mt-7 inline-block rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white">{recovery.ctaText}</span></div>
          </div>
          <div className={`mt-4 rounded-xl border p-4 text-sm font-semibold ${recovery.enabled ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{recovery.enabled ? `Eligible after ${recovery.delayHours} hour${recovery.delayHours === 1 ? '' : 's'} of inactivity.` : 'Recovery capture and reminders are currently paused.'}</div>
        </aside>
      </div>
    </div>
  );
}

function TextField({ label, value, maxLength, onChange }: { label: string; value: string; maxLength: number; onChange: (value: string) => void }) { return <label className="block space-y-2 text-sm font-bold text-gray-700">{label}<input required value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></label>; }
