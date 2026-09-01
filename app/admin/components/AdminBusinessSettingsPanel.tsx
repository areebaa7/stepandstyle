'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_STOREFRONT_SETTINGS } from '@/lib/storefrontSettings';
import type { StorefrontSettingsDTO } from '@/types/storefrontSettings';
import { AdminLoadingState, AdminNotice } from './AdminAsyncState';

type ContactField =
  | 'supportEmail'
  | 'supportPhone'
  | 'whatsappUrl'
  | 'businessAddress'
  | 'returnAddress'
  | 'facebookUrl'
  | 'instagramUrl'
  | 'tiktokUrl'
  | 'youtubeUrl';

const contactFields: ContactField[] = [
  'supportEmail',
  'supportPhone',
  'whatsappUrl',
  'businessAddress',
  'returnAddress',
  'facebookUrl',
  'instagramUrl',
  'tiktokUrl',
  'youtubeUrl',
];

export default function AdminBusinessSettingsPanel() {
  const [settings, setSettings] = useState<StorefrontSettingsDTO>(DEFAULT_STOREFRONT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/admin/settings/storefront', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to load business information.');
        setSettings(payload.data);
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to load business information.' });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const configuredCount = useMemo(
    () => contactFields.filter((field) => settings[field].trim()).length,
    [settings],
  );

  const update = (field: ContactField, value: string) => {
    setSettings((current) => ({ ...current, [field]: value }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice(null);
    try {
      const body = Object.fromEntries(contactFields.map((field) => [field, settings[field]]));
      const response = await fetch('/api/admin/settings/storefront', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to save business information.');
      setSettings(payload.data);
      setNotice({ type: 'success', message: 'Business contact details saved.' });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save business information.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <AdminLoadingState label="Loading business information..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Store identity</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Business Information</h2>
          <p className="mt-1 text-sm text-gray-500">Manage the public contact details and social profiles used across the storefront.</p>
        </div>
        <span className="w-fit rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
          {configuredCount} of {contactFields.length} configured
        </span>
      </div>

      {notice && <AdminNotice type={notice.type} message={notice.message} />}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={save} className="space-y-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Customer support</h3>
              <p className="mt-1 text-sm text-gray-500">Empty fields are automatically hidden from customers.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <BusinessField label="Support email" type="email" maxLength={254} value={settings.supportEmail} onChange={(value) => update('supportEmail', value)} placeholder="support@yourdomain.com" />
              <BusinessField label="Support phone" type="tel" maxLength={32} value={settings.supportPhone} onChange={(value) => update('supportPhone', value)} placeholder="+92 300 0000000" />
            </div>
            <BusinessField label="WhatsApp link" type="url" maxLength={500} value={settings.whatsappUrl} onChange={(value) => update('whatsappUrl', value)} placeholder="https://wa.me/923000000000" hint="Use an official wa.me or WhatsApp HTTPS link." />
          </section>

          <section className="space-y-4 border-t border-gray-200 pt-7">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Business addresses</h3>
              <p className="mt-1 text-sm text-gray-500">Use public business information only; do not enter a private home address.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <BusinessTextarea label="Business address" maxLength={300} value={settings.businessAddress} onChange={(value) => update('businessAddress', value)} />
              <BusinessTextarea label="Return address" maxLength={300} value={settings.returnAddress} onChange={(value) => update('returnAddress', value)} />
            </div>
          </section>

          <section className="space-y-4 border-t border-gray-200 pt-7">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Social profiles</h3>
              <p className="mt-1 text-sm text-gray-500">Only valid HTTPS links for the matching platform are accepted.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <BusinessField label="Facebook" type="url" maxLength={500} value={settings.facebookUrl} onChange={(value) => update('facebookUrl', value)} placeholder="https://facebook.com/..." />
              <BusinessField label="Instagram" type="url" maxLength={500} value={settings.instagramUrl} onChange={(value) => update('instagramUrl', value)} placeholder="https://instagram.com/..." />
              <BusinessField label="TikTok" type="url" maxLength={500} value={settings.tiktokUrl} onChange={(value) => update('tiktokUrl', value)} placeholder="https://tiktok.com/@..." />
              <BusinessField label="YouTube" type="url" maxLength={500} value={settings.youtubeUrl} onChange={(value) => update('youtubeUrl', value)} placeholder="https://youtube.com/@..." />
            </div>
          </section>

          <button disabled={isSaving} className="w-full rounded-xl bg-purple-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save Business Information'}
          </button>
        </form>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <p className="mb-3 text-sm font-semibold text-gray-700">Storefront preview</p>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-[#110C1F] p-6 text-white shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-300">Contact Step &amp; Styl</p>
            <div className="mt-5 space-y-3 text-sm text-white/80">
              {settings.supportEmail && <PreviewLine label="Email" value={settings.supportEmail} />}
              {settings.supportPhone && <PreviewLine label="Phone" value={settings.supportPhone} />}
              {settings.whatsappUrl && <PreviewLine label="WhatsApp" value="Configured" />}
              {settings.businessAddress && <PreviewLine label="Address" value={settings.businessAddress} />}
              {configuredCount === 0 && <p className="rounded-xl bg-white/5 p-4 text-white/60">No public contact details configured. Contact links will stay hidden.</p>}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                ['Facebook', settings.facebookUrl],
                ['Instagram', settings.instagramUrl],
                ['TikTok', settings.tiktokUrl],
                ['YouTube', settings.youtubeUrl],
              ].filter(([, url]) => Boolean(url)).map(([label]) => (
                <span key={label} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold">{label}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function BusinessField({ label, value, type, maxLength, placeholder, hint, onChange }: {
  label: string;
  value: string;
  type: 'email' | 'tel' | 'url';
  maxLength: number;
  placeholder?: string;
  hint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-gray-700">
      {label}
      <input type={type} value={value} maxLength={maxLength} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
      {hint && <span className="block text-xs font-normal text-gray-500">{hint}</span>}
    </label>
  );
}

function BusinessTextarea({ label, value, maxLength, onChange }: {
  label: string;
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-gray-700">
      {label}
      <textarea rows={4} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
    </label>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-purple-300">{label}</p>
      <p className="mt-1 break-words">{value}</p>
    </div>
  );
}
