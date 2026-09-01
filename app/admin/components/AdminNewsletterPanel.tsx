'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminEmptyState, AdminLoadingState, AdminNotice } from './AdminAsyncState';
import AdminPagination from './AdminPagination';

type Provider = 'NONE' | 'MAILCHIMP' | 'BREVO' | 'KLAVIYO';

interface NewsletterSettings {
  popupEnabled: boolean;
  popupDelaySeconds: number;
  incentiveEnabled: boolean;
  incentiveText: string;
  discountCode: string;
  provider: Provider;
  wooCommerceSyncEnabled: boolean;
  consentText: string;
  consentVersion: string;
  privacyPolicyUrl: string;
}

interface Subscriber {
  id: string;
  email: string;
  status: 'SUBSCRIBED' | 'UNSUBSCRIBED';
  source: string;
  consentAt: string;
  consentVersion: string;
  provider: string;
  providerSyncStatus: string;
  providerError: string | null;
  wooSyncStatus: string;
  wooError: string | null;
  updatedAt: string;
}

interface IntegrationStatus {
  mailchimp: boolean;
  brevo: boolean;
  klaviyo: boolean;
  wooCommerce: boolean;
}

interface SubscriberPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const emptySettings: NewsletterSettings = {
  popupEnabled: true,
  popupDelaySeconds: 20,
  incentiveEnabled: false,
  incentiveText: 'Join our list for private offers and new arrivals.',
  discountCode: '',
  provider: 'NONE',
  wooCommerceSyncEnabled: false,
  consentText: 'I agree to receive marketing emails from Step & Styl. I can unsubscribe at any time.',
  consentVersion: '2026-01',
  privacyPolicyUrl: '/privacy-policy',
};

export default function AdminNewsletterPanel() {
  const [settings, setSettings] = useState(emptySettings);
  const [integrations, setIntegrations] = useState<IntegrationStatus>({
    mailchimp: false,
    brevo: false,
    klaviyo: false,
    wooCommerce: false,
  });
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [summary, setSummary] = useState({ total: 0, subscribed: 0, unsubscribed: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<SubscriberPagination>({ page: 1, pageSize: 50, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadSubscribers = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    const response = await fetch(`/api/admin/newsletter/subscribers?${params}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load subscribers.');
    setSubscribers(payload.data || []);
    setSummary(payload.summary || { total: 0, subscribed: 0, unsubscribed: 0 });
    const nextPagination = payload.pagination || { page, pageSize: 50, total: 0, totalPages: 1 };
    setPagination(nextPagination);
    if (nextPagination.page > nextPagination.totalPages) setPage(nextPagination.totalPages);
  }, [page, search, statusFilter]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/newsletter/settings', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to load settings.');
        setSettings({ ...emptySettings, ...payload.data });
        setIntegrations(payload.integrations);
        await loadSubscribers();
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Unable to load email marketing.' });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [loadSubscribers]);

  const save = async () => {
    try {
      setIsSaving(true);
      setNotice(null);
      const response = await fetch('/api/admin/newsletter/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to save settings.');
      setSettings({ ...emptySettings, ...payload.data });
      setNotice({ type: 'success', message: 'Email marketing settings saved.' });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Unable to save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const runAction = async (id: string, action: 'unsubscribe' | 'retry') => {
    if (action === 'unsubscribe' && !window.confirm('Unsubscribe this contact?')) return;
    try {
      setNotice(null);
      const response = await fetch('/api/admin/newsletter/subscribers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Action failed.');
      await loadSubscribers();
      setNotice({ type: 'success', message: action === 'retry' ? 'Integration sync retried.' : 'Contact unsubscribed.' });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Action failed.' });
    }
  };

  const inputClass = 'mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100';

  if (isLoading) return <AdminLoadingState label="Loading email marketing..." />;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-950">Customer Marketing</h2>
        <p className="mt-1 text-sm text-gray-500">Manage consent, popup behavior, incentives and customer sync.</p>
      </div>

      {notice && <AdminNotice type={notice.type} message={notice.message} />}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ['Total contacts', summary.total],
          ['Subscribed', summary.subscribed],
          ['Unsubscribed', summary.unsubscribed],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-950">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-950">Signup experience</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Toggle label="Timed popup enabled" checked={settings.popupEnabled} onChange={(checked) => setSettings({ ...settings, popupEnabled: checked })} />
          <label className="text-sm font-semibold text-gray-700">
            Popup delay (seconds)
            <input className={inputClass} type="number" min={5} max={300} value={settings.popupDelaySeconds} onChange={(event) => setSettings({ ...settings, popupDelaySeconds: Number(event.target.value) })} />
          </label>
          <Toggle label="Discount incentive enabled" checked={settings.incentiveEnabled} onChange={(checked) => setSettings({ ...settings, incentiveEnabled: checked })} />
          <label className="text-sm font-semibold text-gray-700">
            Existing discount code
            <input className={inputClass} value={settings.discountCode} onChange={(event) => setSettings({ ...settings, discountCode: event.target.value.toUpperCase() })} placeholder="WELCOME10" />
          </label>
          <label className="text-sm font-semibold text-gray-700 md:col-span-2">
            Popup message
            <input className={inputClass} value={settings.incentiveText} onChange={(event) => setSettings({ ...settings, incentiveText: event.target.value })} />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-950">Consent</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700 md:col-span-2">
            Consent wording
            <textarea className={inputClass} rows={3} value={settings.consentText} onChange={(event) => setSettings({ ...settings, consentText: event.target.value })} />
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Consent version
            <input className={inputClass} value={settings.consentVersion} onChange={(event) => setSettings({ ...settings, consentVersion: event.target.value })} />
          </label>
          <label className="text-sm font-semibold text-gray-700">
            Privacy policy URL
            <input className={inputClass} value={settings.privacyPolicyUrl} onChange={(event) => setSettings({ ...settings, privacyPolicyUrl: event.target.value })} />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-950">Integrations</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-semibold text-gray-700">
            Email marketing provider
            <select className={inputClass} value={settings.provider} onChange={(event) => setSettings({ ...settings, provider: event.target.value as Provider })}>
              <option value="NONE">None (local database only)</option>
              <option value="MAILCHIMP">Mailchimp</option>
              <option value="BREVO">Brevo</option>
              <option value="KLAVIYO">Klaviyo</option>
            </select>
          </label>
          <Toggle label="WooCommerce customer sync" checked={settings.wooCommerceSyncEnabled} onChange={(checked) => setSettings({ ...settings, wooCommerceSyncEnabled: checked })} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <StatusBadge label="Mailchimp" ready={integrations.mailchimp} />
          <StatusBadge label="Brevo" ready={integrations.brevo} />
          <StatusBadge label="Klaviyo" ready={integrations.klaviyo} />
          <StatusBadge label="WooCommerce" ready={integrations.wooCommerce} />
        </div>
        <p className="mt-3 text-xs leading-5 text-gray-500">Credentials are read securely from server environment variables. A red badge means the required credentials have not been configured.</p>
      </section>

      <button onClick={save} disabled={isSaving} className="rounded-xl bg-purple-600 px-6 py-3 font-bold text-white hover:bg-purple-700 disabled:opacity-50">
        {isSaving ? 'Saving...' : 'Save email marketing settings'}
      </button>

      <section className="overflow-hidden rounded-2xl border border-gray-200">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row">
          <input className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-purple-500" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search email address" />
          <select className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="SUBSCRIBED">Subscribed</option>
            <option value="UNSUBSCRIBED">Unsubscribed</option>
          </select>
          <button onClick={() => void loadSubscribers()} className="rounded-xl border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-700">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Consent</th><th className="px-5 py-3">Sync</th><th className="px-5 py-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id}>
                  <td className="px-5 py-4"><p className="font-semibold text-gray-950">{subscriber.email}</p><p className="mt-1 text-xs text-gray-500">{subscriber.source} · {subscriber.status}</p></td>
                  <td className="px-5 py-4 text-xs text-gray-600">{new Date(subscriber.consentAt).toLocaleString()}<br />Version {subscriber.consentVersion}</td>
                  <td className="px-5 py-4 text-xs"><p>{subscriber.provider}: {subscriber.providerSyncStatus}</p><p>Woo: {subscriber.wooSyncStatus}</p>{(subscriber.providerError || subscriber.wooError) && <p className="mt-1 max-w-xs text-red-600" title={subscriber.providerError || subscriber.wooError || ''}>Sync needs attention</p>}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {subscriber.status === 'SUBSCRIBED' && <button onClick={() => void runAction(subscriber.id, 'retry')} className="font-semibold text-purple-700 underline">Retry sync</button>}
                      {subscriber.status === 'SUBSCRIBED' && <button onClick={() => void runAction(subscriber.id, 'unsubscribe')} className="font-semibold text-red-600 underline">Unsubscribe</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {subscribers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-5">
                    <AdminEmptyState
                      title="No newsletter contacts found"
                      description="Contacts will appear here after they subscribe or consent during checkout."
                      compact
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination page={pagination.page} pageSize={pagination.pageSize} totalItems={pagination.total} itemLabel="contacts" onPageChange={setPage} />
      </section>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 rounded text-purple-600 focus:ring-purple-500" />
    </label>
  );
}

function StatusBadge({ label, ready }: { label: string; ready: boolean }) {
  return <span className={`rounded-full px-3 py-1 font-semibold ${ready ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{label}: {ready ? 'configured' : 'not configured'}</span>;
}
