'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Edit2, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import FileUpload from './FileUpload';
import type { ReelCategory, ReelDTO } from '@/types/reel';
import { AdminEmptyState, AdminLoadingState, AdminNotice } from './AdminAsyncState';

const CATEGORIES: Array<{ id: ReelCategory; label: string }> = [
  { id: 'TRENDING_PRODUCTS', label: 'Trending Products' },
  { id: 'CUSTOMER_REVIEWS', label: 'Customer Reviews' },
  { id: 'PRODUCT_DEMONSTRATIONS', label: 'Product Demonstrations' },
  { id: 'SHORT_REELS', label: 'Short Reels' },
];

const emptyReel = (): Partial<ReelDTO> => ({
  category: 'SHORT_REELS',
  title: '',
  caption: '',
  videoUrl: '',
  posterUrl: '',
  productLink: '',
  isActive: true,
  order: 0,
});

export default function AdminReelsPanel() {
  const [reels, setReels] = useState<ReelDTO[]>([]);
  const [currentReel, setCurrentReel] = useState<Partial<ReelDTO>>(emptyReel());
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchReels = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/reels', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to load reels.');
      setReels(payload.reels);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load reels.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial server synchronization for this admin panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReels();
  }, [fetchReels]);

  const startNew = () => {
    setCurrentReel({ ...emptyReel(), order: reels.length });
    setMessage(null);
    setIsEditing(true);
  };

  const saveReel = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentReel.title?.trim() || !currentReel.videoUrl) {
      setMessage({ type: 'error', text: 'Add a title and upload a video before saving.' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);
      const response = await fetch(currentReel.id ? `/api/reels/${currentReel.id}` : '/api/reels', {
        method: currentReel.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentReel),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to save reel.');

      setMessage({ type: 'success', text: currentReel.id ? 'Reel updated.' : 'Reel created.' });
      setIsEditing(false);
      await fetchReels();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save reel.' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateReel = async (id: string, data: Partial<ReelDTO>) => {
    const response = await fetch(`/api/reels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = await response.json();
    if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to update reel.');
  };

  const togglePublished = async (reel: ReelDTO) => {
    try {
      await updateReel(reel.id, { isActive: !reel.isActive });
      await fetchReels();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update reel.' });
    }
  };

  const moveReel = async (reel: ReelDTO, direction: -1 | 1) => {
    try {
      await updateReel(reel.id, { order: reel.order + direction });
      await fetchReels();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to reorder reel.' });
    }
  };

  const deleteReel = async (id: string) => {
    if (!window.confirm('Delete this reel from the homepage?')) return;
    try {
      const response = await fetch(`/api/reels/${id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to delete reel.');
      await fetchReels();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to delete reel.' });
    }
  };

  if (isLoading) return <AdminLoadingState label="Loading reels..." />;

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Homepage content</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{currentReel.id ? 'Edit Reel' : 'Upload New Reel'}</h2>
          </div>
          <button type="button" onClick={() => setIsEditing(false)} className="rounded-full bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200">
            Cancel
          </button>
        </div>

        {message && (
          <p className={`rounded-xl px-4 py-3 text-sm font-semibold ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message.text}
          </p>
        )}

        <form onSubmit={saveReel} className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-gray-700">
                Content type
                <select
                  value={currentReel.category}
                  onChange={(event) => setCurrentReel({ ...currentReel, category: event.target.value as ReelCategory })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                >
                  {CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-gray-700">
                Display order
                <input
                  type="number"
                  value={currentReel.order ?? 0}
                  onChange={(event) => setCurrentReel({ ...currentReel, order: Number(event.target.value) })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm font-semibold text-gray-700">
              Title
              <input
                required
                maxLength={100}
                value={currentReel.title ?? ''}
                onChange={(event) => setCurrentReel({ ...currentReel, title: event.target.value })}
                placeholder="What viewers should notice"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </label>

            <label className="block space-y-2 text-sm font-semibold text-gray-700">
              Caption
              <textarea
                maxLength={300}
                rows={3}
                value={currentReel.caption ?? ''}
                onChange={(event) => setCurrentReel({ ...currentReel, caption: event.target.value })}
                placeholder="Optional supporting message"
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </label>

            <FileUpload
              accept="video"
              label="Vertical video"
              placeholder="Portrait 9:16 recommended · MP4, WebM, OGG or MOV"
              value={currentReel.videoUrl ?? ''}
              onChange={(videoUrl) => setCurrentReel({ ...currentReel, videoUrl })}
            />

            <FileUpload
              accept="image"
              label="Poster image (optional)"
              placeholder="Portrait 9:16 recommended"
              value={currentReel.posterUrl ?? ''}
              onChange={(posterUrl) => setCurrentReel({ ...currentReel, posterUrl })}
            />

            <label className="block space-y-2 text-sm font-semibold text-gray-700">
              Product or page link (optional)
              <input
                value={currentReel.productLink ?? ''}
                onChange={(event) => setCurrentReel({ ...currentReel, productLink: event.target.value })}
                placeholder="/products/product-slug"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-900">
              <input
                type="checkbox"
                checked={currentReel.isActive ?? true}
                onChange={(event) => setCurrentReel({ ...currentReel, isActive: event.target.checked })}
                className="h-4 w-4 accent-purple-600"
              />
              Publish on homepage
            </label>

            <button disabled={isSaving} className="w-full rounded-xl bg-purple-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Reel'}
            </button>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="mb-3 text-sm font-semibold text-gray-700">Portrait preview</p>
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[320px] overflow-hidden rounded-[2rem] bg-gray-950 shadow-2xl">
              {currentReel.videoUrl ? (
                <video src={currentReel.videoUrl} poster={currentReel.posterUrl || undefined} muted loop autoPlay playsInline className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-8 text-center text-sm text-white/50">Upload a video to see it here.</div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 pt-24 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-200">{CATEGORIES.find((item) => item.id === currentReel.category)?.label}</p>
                <h3 className="mt-2 text-xl font-bold">{currentReel.title || 'Reel title'}</h3>
                {currentReel.caption && <p className="mt-2 text-sm text-white/80">{currentReel.caption}</p>}
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Homepage content</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Reels Manager</h2>
          <p className="mt-1 text-sm text-gray-500">Upload portrait videos and control their category, order and visibility.</p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-200 hover:bg-purple-700">
          <Plus className="h-4 w-4" /> Add Reel
        </button>
      </div>

      {message && (
        <AdminNotice type={message.type} message={message.text} />
      )}

      {reels.length === 0 ? (
        <AdminEmptyState
          title="No reels uploaded"
          description="Upload a portrait video to populate the homepage reels section."
          action={{ label: 'Upload first reel', onClick: startNew }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reels.map((reel) => (
            <article key={reel.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative aspect-[9/16] bg-black">
                <video src={reel.videoUrl} poster={reel.posterUrl || undefined} muted loop playsInline className="h-full w-full object-cover" />
                <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${reel.isActive ? 'bg-green-500 text-white' : 'bg-gray-900/80 text-white'}`}>
                  {reel.isActive ? 'Published' : 'Hidden'}
                </span>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-4 pt-14 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-200">{CATEGORIES.find((item) => item.id === reel.category)?.label}</p>
                  <h3 className="mt-1 line-clamp-2 font-bold">{reel.title}</h3>
                </div>
              </div>
              <div className="flex items-center justify-between gap-1 p-3">
                <div className="flex gap-1">
                  <button type="button" title="Move up" onClick={() => moveReel(reel, -1)} className="rounded-lg p-2 text-gray-500 hover:bg-purple-50 hover:text-purple-700"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" title="Move down" onClick={() => moveReel(reel, 1)} className="rounded-lg p-2 text-gray-500 hover:bg-purple-50 hover:text-purple-700"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" title={reel.isActive ? 'Hide' : 'Publish'} onClick={() => togglePublished(reel)} className="rounded-lg p-2 text-gray-500 hover:bg-purple-50 hover:text-purple-700">
                    {reel.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex gap-1">
                  <button type="button" title="Edit" onClick={() => { setCurrentReel(reel); setMessage(null); setIsEditing(true); }} className="rounded-lg p-2 text-gray-500 hover:bg-purple-50 hover:text-purple-700"><Edit2 className="h-4 w-4" /></button>
                  <button type="button" title="Delete" onClick={() => deleteReel(reel.id)} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
