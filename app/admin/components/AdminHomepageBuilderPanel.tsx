'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical } from 'lucide-react';
import { DEFAULT_HOMEPAGE_SECTIONS } from '@/lib/storefrontSettings';
import type { HomepageSectionSetting } from '@/types/storefrontSettings';
import { AdminLoadingState, AdminNotice } from './AdminAsyncState';

export default function AdminHomepageBuilderPanel() {
  const [sections, setSections] = useState<HomepageSectionSetting[]>(DEFAULT_HOMEPAGE_SECTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadSections = async () => {
      try {
        const response = await fetch('/api/admin/settings/storefront', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to load homepage sections.');
        setSections(payload.data.homepageSections);
      } catch (error) {
        setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load homepage sections.' });
      } finally {
        setIsLoading(false);
      }
    };
    loadSections();
  }, []);

  const moveSection = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= sections.length) return;
    setSections((current) => {
      const updated = [...current];
      [updated[index], updated[destination]] = [updated[destination], updated[index]];
      return updated.map((section, order) => ({ ...section, order }));
    });
  };

  const toggleSection = (id: HomepageSectionSetting['id']) => {
    setSections((current) => current.map((section) => (
      section.id === id ? { ...section, isVisible: !section.isVisible } : section
    )));
  };

  const saveSections = async () => {
    try {
      setIsSaving(true);
      setMessage(null);
      const response = await fetch('/api/admin/settings/storefront', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homepageSections: sections }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to save homepage layout.');
      setSections(payload.data.homepageSections);
      setMessage({ type: 'success', text: 'Homepage layout published.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save homepage layout.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <AdminLoadingState label="Loading homepage builder..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Storefront layout</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Homepage Builder</h2>
          <p className="mt-1 text-sm text-gray-500">Move sections up or down and hide anything you do not want published.</p>
        </div>
        <a href="/?preview=true" target="_blank" rel="noopener noreferrer" className="rounded-full border border-purple-200 bg-purple-50 px-5 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-100">
          Preview Homepage
        </a>
      </div>

      {message && (
        <AdminNotice type={message.type} message={message.text} />
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm">
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={section.id} className={`flex items-center gap-3 rounded-xl border bg-white p-3 transition ${section.isVisible ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'}`}>
              <GripVertical className="h-5 w-5 shrink-0 text-gray-300" />
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-purple-50 text-xs font-bold text-purple-700">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">{section.label}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{section.id.replaceAll('_', ' ')}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" title="Move up" disabled={index === 0} onClick={() => moveSection(index, -1)} className="rounded-lg p-2 text-gray-500 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-20"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" title="Move down" disabled={index === sections.length - 1} onClick={() => moveSection(index, 1)} className="rounded-lg p-2 text-gray-500 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-20"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" title={section.isVisible ? 'Hide section' : 'Show section'} onClick={() => toggleSection(section.id)} className={`rounded-lg p-2 ${section.isVisible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                  {section.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={saveSections} disabled={isSaving} className="w-full rounded-xl bg-purple-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50">
        {isSaving ? 'Publishing...' : 'Publish Homepage Layout'}
      </button>
    </div>
  );
}
