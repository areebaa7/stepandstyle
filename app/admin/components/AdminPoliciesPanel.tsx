'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_STOREFRONT_SETTINGS } from '@/lib/storefrontSettings';
import type { StorePolicyKey, StorePolicyPage, StorefrontSettingsDTO } from '@/types/storefrontSettings';
import { AdminLoadingState, AdminNotice } from './AdminAsyncState';

const policyTabs: Array<{ key: StorePolicyKey; label: string }> = [
  { key: 'shippingPolicy', label: 'Shipping' },
  { key: 'returnsPolicy', label: 'Returns & Exchanges' },
  { key: 'privacyPolicy', label: 'Privacy' },
  { key: 'termsPolicy', label: 'Terms & Conditions' },
];

export default function AdminPoliciesPanel() {
  const [settings, setSettings] = useState<StorefrontSettingsDTO>(DEFAULT_STOREFRONT_SETTINGS);
  const [activeKey, setActiveKey] = useState<StorePolicyKey>('shippingPolicy');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const policy = settings[activeKey];

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/admin/settings/storefront', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to load policy content.');
        setSettings(payload.data);
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to load policy content.' });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const updatePolicy = (update: Partial<StorePolicyPage>) => {
    setSettings((current) => ({
      ...current,
      [activeKey]: { ...current[activeKey], ...update },
    }));
  };

  const updateSection = (index: number, field: 'heading' | 'body', value: string) => {
    updatePolicy({
      sections: policy.sections.map((section, sectionIndex) => (
        sectionIndex === index ? { ...section, [field]: value } : section
      )),
    });
  };

  const addSection = () => {
    const id = `section-${crypto.randomUUID()}`;
    updatePolicy({ sections: [...policy.sections, { id, heading: '', body: '' }] });
  };

  const removeSection = (index: number) => {
    if (policy.sections.length === 1) return;
    updatePolicy({ sections: policy.sections.filter((_, sectionIndex) => sectionIndex !== index) });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= policy.sections.length) return;
    const sections = [...policy.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    updatePolicy({ sections });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setNotice(null);
    try {
      const response = await fetch('/api/admin/settings/storefront', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [activeKey]: policy }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to save policy content.');
      setSettings(payload.data);
      setNotice({ type: 'success', message: `${policy.title} saved and published.` });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save policy content.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <AdminLoadingState label="Loading storefront policies..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Store content</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">Policies &amp; Terms</h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">Edit the structured content shown on public policy pages. Text is rendered safely without accepting HTML or scripts.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {policyTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setActiveKey(tab.key); setNotice(null); }}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${activeKey === tab.key ? 'border-purple-600 bg-purple-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {notice && <AdminNotice type={notice.type} message={notice.message} />}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <form onSubmit={save} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_190px]">
            <PolicyField label="Page title" value={policy.title} maxLength={120} onChange={(value) => updatePolicy({ title: value })} />
            <label className="block space-y-2 text-sm font-semibold text-gray-700">
              Last updated
              <input required type="date" value={policy.lastUpdated} onChange={(event) => updatePolicy({ lastUpdated: event.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-semibold text-gray-700">
            Page summary
            <textarea required rows={3} value={policy.summary} maxLength={500} onChange={(event) => updatePolicy({ summary: event.target.value })} className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
            <span className="block text-right text-xs font-normal text-gray-400">{policy.summary.length}/500</span>
          </label>

          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <div>
              <h3 className="font-bold text-gray-900">Content sections</h3>
              <p className="text-xs text-gray-500">1 to 20 sections; each section needs a heading and text.</p>
            </div>
            <button type="button" disabled={policy.sections.length >= 20} onClick={addSection} className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-100 disabled:opacity-40">+ Add section</button>
          </div>

          <div className="space-y-4">
            {policy.sections.map((section, index) => (
              <section key={section.id} className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Section {index + 1}</span>
                  <div className="flex gap-1.5">
                    <SmallButton label="Move up" disabled={index === 0} onClick={() => moveSection(index, -1)}>↑</SmallButton>
                    <SmallButton label="Move down" disabled={index === policy.sections.length - 1} onClick={() => moveSection(index, 1)}>↓</SmallButton>
                    <SmallButton label="Remove section" disabled={policy.sections.length === 1} danger onClick={() => removeSection(index)}>Remove</SmallButton>
                  </div>
                </div>
                <div className="space-y-4">
                  <PolicyField label="Heading" value={section.heading} maxLength={120} onChange={(value) => updateSection(index, 'heading', value)} />
                  <label className="block space-y-2 text-sm font-semibold text-gray-700">
                    Section text
                    <textarea required rows={6} value={section.body} maxLength={4000} onChange={(event) => updateSection(index, 'body', event.target.value)} className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 leading-6 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
                    <span className="block text-right text-xs font-normal text-gray-400">{section.body.length}/4000</span>
                  </label>
                </div>
              </section>
            ))}
          </div>

          <button disabled={isSaving} className="w-full rounded-xl bg-purple-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:opacity-50">
            {isSaving ? 'Saving...' : `Save ${policyTabs.find((tab) => tab.key === activeKey)?.label}`}
          </button>
        </form>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <p className="mb-3 text-sm font-semibold text-gray-700">Public-page preview</p>
          <div className="max-h-[75vh] overflow-y-auto rounded-2xl border border-gray-200 bg-[#FAF9FF] p-6 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">Policy</p>
            <h3 className="mt-3 text-2xl font-bold text-gray-950">{policy.title || 'Untitled policy'}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">{policy.summary || 'Add a short page summary.'}</p>
            <p className="mt-3 text-xs text-gray-400">Last updated: {policy.lastUpdated || 'Not set'}</p>
            <div className="mt-7 space-y-5">
              {policy.sections.map((section) => (
                <div key={section.id} className="border-t border-purple-100 pt-4">
                  <h4 className="font-bold text-gray-900">{section.heading || 'Untitled section'}</h4>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">{section.body || 'Add section text.'}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PolicyField({ label, value, maxLength, onChange }: { label: string; value: string; maxLength: number; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-gray-700">
      {label}
      <input required value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
    </label>
  );
}

function SmallButton({ label, children, disabled, danger = false, onClick }: { label: string; children: React.ReactNode; disabled: boolean; danger?: boolean; onClick: () => void }) {
  return (
    <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold disabled:opacity-30 ${danger ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100' : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-700'}`}>
      {children}
    </button>
  );
}
