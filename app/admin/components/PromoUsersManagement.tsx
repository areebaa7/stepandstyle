'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AccountModal, { AuthMode } from '@/app/components/AccountModal';
import { AdminEmptyState, AdminLoadingState, AdminNotice } from './AdminAsyncState';
import { AdminFilterSearch, AdminFilterSelect } from './AdminFilterControl';

interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  validUntil: string;
  usageCount: number;
  usageLimit: number | null;
  createdAt: string;
  influencer?: {
    id: string;
    defaultPrefix: string;
    commissionRate: string;
    user: {
      name: string | null;
  email: string;
    };
  } | null;
}

interface Influencer {
  id: string;
  defaultPrefix: string;
  commissionRate: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  _count?: {
    promoCodes: number;
  };
}

const randomCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'STYLE-';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
};

export default function PromoUsersManagement() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [promoCodeStatus, setPromoCodeStatus] = useState<{ type: 'idle' | 'error' | 'success'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [influencerStatus, setInfluencerStatus] = useState<{ type: 'idle' | 'error' | 'success'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [isPromoCodesLoading, setIsPromoCodesLoading] = useState(true);
  const [isSavingPromoCode, setIsSavingPromoCode] = useState(false);
  const [isLoadingInfluencers, setIsLoadingInfluencers] = useState(true);
  const [isInfluencerModalOpen, setIsInfluencerModalOpen] = useState(false);
  const [influencerModalMode, setInfluencerModalMode] = useState<AuthMode>('register');
  const [promoSearch, setPromoSearch] = useState('');
  const [promoFilter, setPromoFilter] = useState('ALL');
  const [promoReferenceTime, setPromoReferenceTime] = useState(0);
  const [influencerSearch, setInfluencerSearch] = useState('');
  const [influencerStatusFilter, setInfluencerStatusFilter] = useState('ALL');

  const [promoCodeForm, setPromoCodeForm] = useState({
    code: '',
    validUntil: '',
    discountPercent: '',
    usageLimit: '',
    influencerId: '',
    prefix: '',
  });
  const [editingPromoCodeId, setEditingPromoCodeId] = useState<string | null>(null);


  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsPromoCodesLoading(true);
        setIsLoadingInfluencers(true);
        const [codesResponse, influencersResponse] = await Promise.all([
          fetch('/api/promo-codes', { cache: 'no-store' }),
          fetch('/api/influencers', { cache: 'no-store' }),
        ]);

        if (!codesResponse.ok) {
          const payload = await codesResponse.json();
          throw new Error(payload.error || 'Failed to load promo codes.');
        }

        if (!influencersResponse.ok) {
          const payload = await influencersResponse.json();
          throw new Error(payload.error || 'Failed to load influencers.');
        }

        const codesData = await codesResponse.json();
        const influencerData = await influencersResponse.json();
        setPromoCodes(codesData.codes ?? []);
        setPromoReferenceTime(Date.now());
        setInfluencers(influencerData.influencers ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load data.';
        setPromoCodeStatus({ type: 'error', message });
        setInfluencerStatus({ type: 'error', message });
      } finally {
        setIsPromoCodesLoading(false);
        setIsLoadingInfluencers(false);
      }
    };

    fetchAll();
  }, []);

  const handleCreatePromoCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setPromoCodeStatus({ type: 'idle', message: '' });

    if (!promoCodeForm.validUntil) {
      setPromoCodeStatus({ type: 'error', message: 'Please select a validity date.' });
      return;
    }

    const discountValue = parseInt(promoCodeForm.discountPercent, 10);
    if (Number.isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
      setPromoCodeStatus({ type: 'error', message: 'Discount must be between 1 and 100%.' });
      return;
    }

    const usageLimitValue = promoCodeForm.usageLimit.trim() === ''
      ? null
      : parseInt(promoCodeForm.usageLimit, 10);
    if (usageLimitValue !== null && (Number.isNaN(usageLimitValue) || usageLimitValue < 1)) {
      setPromoCodeStatus({ type: 'error', message: 'Usage limit must be a positive number, or empty for unlimited.' });
      return;
    }

    setIsSavingPromoCode(true);

    try {
      const payload = {
        code: promoCodeForm.code || undefined,
        validUntil: promoCodeForm.validUntil,
        discountPercent: discountValue,
        usageLimit: usageLimitValue,
        influencerId: promoCodeForm.influencerId || undefined,
        prefix: promoCodeForm.prefix || undefined,
      };

      const response = editingPromoCodeId
        ? await fetch(`/api/promo-codes/${editingPromoCodeId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/promo-codes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      const data = await response.json();

      if (!response.ok || !data.code) {
        throw new Error(data.error || 'Failed to save promo code.');
      }

      if (editingPromoCodeId) {
        setPromoCodes((prev) => prev.map((promo) => promo.id === editingPromoCodeId ? (data.code as PromoCode) : promo));
        setPromoCodeStatus({ type: 'success', message: 'Promo code updated successfully.' });
      } else {
        setPromoCodes((prev) => [data.code as PromoCode, ...prev]);
        setPromoCodeStatus({ type: 'success', message: 'Promo code saved successfully.' });
      }
      setPromoCodeForm({
        code: '',
        validUntil: '',
        discountPercent: '',
        usageLimit: '',
        influencerId: '',
        prefix: '',
      });
      setEditingPromoCodeId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save promo code.';
      setPromoCodeStatus({ type: 'error', message });
    } finally {
      setIsSavingPromoCode(false);
    }
  };

  const startEditingPromoCode = (promo: PromoCode) => {
    setEditingPromoCodeId(promo.id);
    setPromoCodeForm({
      code: promo.code,
      validUntil: promo.validUntil.slice(0, 10),
      discountPercent: String(promo.discountPercent),
      usageLimit: promo.usageLimit === null ? '' : String(promo.usageLimit),
      influencerId: promo.influencer?.id ?? '',
      prefix: promo.influencer?.defaultPrefix ?? '',
    });
    setPromoCodeStatus({ type: 'idle', message: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditingPromoCode = () => {
    setEditingPromoCodeId(null);
    setPromoCodeForm({
      code: '',
      validUntil: '',
      discountPercent: '',
      usageLimit: '',
      influencerId: '',
      prefix: '',
    });
    setPromoCodeStatus({ type: 'idle', message: '' });
  };

  const handleInfluencerAuthSuccess = async () => {
    // Refresh influencers list after successful registration
    try {
      const response = await fetch('/api/influencers', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setInfluencers(data.influencers ?? []);
      }
    } catch (error) {
      console.error('Failed to refresh influencers:', error);
    }
    setIsInfluencerModalOpen(false);
  };

  const selectedInfluencer = promoCodeForm.influencerId
    ? influencers.find((inf) => inf.id === promoCodeForm.influencerId)
    : null;

  const filteredPromoCodes = useMemo(() => {
    const normalizedSearch = promoSearch.trim().toLowerCase();
    return promoCodes.filter((promo) => {
      const matchesSearch = !normalizedSearch || [
        promo.code,
        promo.influencer?.defaultPrefix,
        promo.influencer?.user.name,
        promo.influencer?.user.email,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
      const expiresAt = new Date(promo.validUntil).getTime();
      const matchesFilter = promoFilter === 'ALL'
        || (promoFilter === 'ACTIVE' && expiresAt >= promoReferenceTime)
        || (promoFilter === 'EXPIRED' && expiresAt < promoReferenceTime)
        || (promoFilter === 'INFLUENCER' && Boolean(promo.influencer))
        || (promoFilter === 'GENERAL' && !promo.influencer);
      return matchesSearch && matchesFilter;
    });
  }, [promoCodes, promoFilter, promoReferenceTime, promoSearch]);
  const availablePromoFilters = useMemo(() => [
    ...(promoCodes.some((promo) => new Date(promo.validUntil).getTime() >= promoReferenceTime) ? [{ value: 'ACTIVE', label: 'Active' }] : []),
    ...(promoCodes.some((promo) => new Date(promo.validUntil).getTime() < promoReferenceTime) ? [{ value: 'EXPIRED', label: 'Expired' }] : []),
    ...(promoCodes.some((promo) => Boolean(promo.influencer)) ? [{ value: 'INFLUENCER', label: 'Influencer codes' }] : []),
    ...(promoCodes.some((promo) => !promo.influencer) ? [{ value: 'GENERAL', label: 'General codes' }] : []),
  ], [promoCodes, promoReferenceTime]);

  const filteredInfluencers = useMemo(() => {
    const normalizedSearch = influencerSearch.trim().toLowerCase();
    return influencers.filter((influencer) => {
      const matchesSearch = !normalizedSearch || [
        influencer.user.name,
        influencer.user.email,
        influencer.defaultPrefix,
      ].some((value) => value?.toLowerCase().includes(normalizedSearch));
      return matchesSearch && (influencerStatusFilter === 'ALL' || influencer.status === influencerStatusFilter);
    });
  }, [influencerSearch, influencerStatusFilter, influencers]);

  const influencerStatuses = useMemo(() => Array.from(new Set(influencers.map((influencer) => influencer.status))).sort(), [influencers]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Promo & Influencer Management</h2>
          <p className="text-sm text-gray-600 mt-2">
            Generate promo codes, track influencer performance, and manage campaigns.
          </p>
        </div>
        <button
          onClick={() => {
            setInfluencerModalMode('register');
            setIsInfluencerModalOpen(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
        >
          + Add Influencer
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Promo Codes</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">Generate & Track Campaign Codes</h3>
            <p className="text-sm text-gray-600 mt-1">
              Admin-only code generation. Select an influencer to auto-generate their next code.
            </p>
          </div>
          <button
            onClick={() =>
              setPromoCodeForm((prev) => ({ ...prev, code: randomCode(), influencerId: '', prefix: '' }))
            }
            className="self-start md:self-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-md"
          >
            Generate Random Code
          </button>
        </div>

        <form onSubmit={handleCreatePromoCode} className="grid md:grid-cols-2 gap-4 mb-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
          {editingPromoCodeId && (
            <div className="md:col-span-2 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <span className="text-sm font-semibold text-amber-800">
                Editing code {promoCodeForm.code || ''} — update discount, validity or usage limit. Code itself cannot be changed.
              </span>
              <button
                type="button"
                onClick={cancelEditingPromoCode}
                className="text-xs font-bold uppercase tracking-widest text-amber-700 hover:text-amber-900"
              >
                Cancel Edit
              </button>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Promo Code</label>
            <input
              type="text"
              value={promoCodeForm.code}
              onChange={(e) => setPromoCodeForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg text-gray-900 placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all hover:border-slate-400 uppercase disabled:bg-slate-100 disabled:cursor-not-allowed"
              placeholder={selectedInfluencer ? `${selectedInfluencer.defaultPrefix}_AUTO` : 'STYLE-XXXXX'}
              disabled={!!selectedInfluencer || !!editingPromoCodeId}
            />
            <p className="text-xs text-gray-600 mt-2">
              {editingPromoCodeId
                ? 'Code cannot be changed after creation.'
                : selectedInfluencer
                  ? 'Code will be auto-generated using the influencer prefix.'
                  : 'Enter a custom code or click "Generate Random Code".'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Assign to Influencer (optional)</label>
            <select
              value={promoCodeForm.influencerId}
              onChange={(e) =>
                setPromoCodeForm((prev) => ({
                  ...prev,
                  influencerId: e.target.value,
                  code: e.target.value ? '' : prev.code,
                }))
              }
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all hover:border-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
              disabled={!!editingPromoCodeId}
            >
              <option value="">General Campaign</option>
              {influencers.map((inf) => (
                <option key={inf.id} value={inf.id}>
                  {inf.user.name || inf.user.email} ({inf.defaultPrefix})
                </option>
              ))}
            </select>
          </div>
          {!selectedInfluencer && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Prefix (optional)</label>
              <input
                type="text"
                value={promoCodeForm.prefix}
                onChange={(e) => setPromoCodeForm((prev) => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg text-gray-900 placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all hover:border-slate-400 uppercase"
                placeholder="FOOT_GEN"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Validity *</label>
            <input
              type="date"
              required
              value={promoCodeForm.validUntil}
              onChange={(e) => setPromoCodeForm((prev) => ({ ...prev, validUntil: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all hover:border-slate-400"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Discount Percentage (%) *</label>
            <input
              type="number"
              required
              min={1}
              max={100}
              value={promoCodeForm.discountPercent}
              onChange={(e) => setPromoCodeForm((prev) => ({ ...prev, discountPercent: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg text-gray-900 placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all hover:border-slate-400"
              placeholder="e.g. 20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Usage Limit (optional)</label>
            <input
              type="number"
              min={1}
              value={promoCodeForm.usageLimit}
              onChange={(e) => setPromoCodeForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg text-gray-900 placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all hover:border-slate-400"
              placeholder="e.g. 100 — leave empty for unlimited"
            />
            <p className="text-xs text-gray-600 mt-2">
              Maximum number of times this code can be redeemed. Empty = unlimited.
            </p>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSavingPromoCode}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-60"
            >
              {isSavingPromoCode ? 'Saving...' : editingPromoCodeId ? 'Update Promo Code' : 'Save Promo Code'}
            </button>
          </div>
        </form>

        {promoCodeStatus.type !== 'idle' && (
          <div className="mb-4">
            <AdminNotice type={promoCodeStatus.type} message={promoCodeStatus.message} />
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
          <div className="space-y-3 px-6 py-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-gray-900">Promo Codes Table</h4>
              <span className="text-sm text-gray-600 font-medium">{isPromoCodesLoading ? '...' : `${filteredPromoCodes.length} of ${promoCodes.length}`} shown</span>
            </div>
            {!isPromoCodesLoading && promoCodes.length > 0 && (
              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <AdminFilterSearch label="Search promo codes" value={promoSearch} onChange={(event) => setPromoSearch(event.target.value)} placeholder="Code, influencer or prefix" />
                <AdminFilterSelect label="Code type" aria-label="Promo code filter" value={promoFilter} onChange={(event) => setPromoFilter(event.target.value)}>
                  <option value="ALL">All promo codes</option>
                  {availablePromoFilters.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </AdminFilterSelect>
              </div>
            )}
          </div>

          {isPromoCodesLoading ? (
            <div className="p-5"><AdminLoadingState label="Loading promo codes..." /></div>
          ) : promoCodes.length === 0 ? (
            <div className="p-5">
              <AdminEmptyState
                title="No promo codes generated yet"
                description="Use the generator above to create the first code."
                compact
              />
            </div>
          ) : filteredPromoCodes.length === 0 ? (
            <div className="p-5"><AdminEmptyState title="No promo codes match these filters" description="Change the search or filter to see more codes." action={{ label: 'Clear filters', onClick: () => { setPromoSearch(''); setPromoFilter('ALL'); } }} compact /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Promo Code</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Influencer</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Discount (%)</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Usage</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Valid Till</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Created</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPromoCodes.map((promo) => (
                    <tr key={promo.id} className="hover:bg-white transition-colors">
                      <td className="px-6 py-3">
                        <span className="font-mono font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded">{promo.code}</span>
                      </td>
                      <td className="px-6 py-3">
                        {promo.influencer ? (
                          <div>
                            <p className="font-semibold text-gray-900">{promo.influencer.user.name || promo.influencer.user.email}</p>
                            <p className="text-xs text-gray-600">{promo.influencer.defaultPrefix}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600 font-medium">General</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-900 font-semibold">{promo.discountPercent}%</td>
                      <td className="px-6 py-3">
                        {promo.usageLimit === null ? (
                          <span className="text-gray-700">{promo.usageCount} used</span>
                        ) : (
                          <div>
                            <p className={`font-semibold ${promo.usageCount >= promo.usageLimit ? 'text-red-600' : 'text-gray-900'}`}>
                              {promo.usageCount} / {promo.usageLimit}
                            </p>
                            <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${promo.usageCount >= promo.usageLimit ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, (promo.usageCount / promo.usageLimit) * 100)}%` }}
                              />
                            </div>
                            {promo.usageCount >= promo.usageLimit && (
                              <span className="text-xs font-semibold text-red-600">Exhausted</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        {new Date(promo.validUntil).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {new Date(promo.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => startEditingPromoCode(promo)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Influencers</h3>
            <p className="text-sm text-gray-600 mt-1">Overview of all active promo partners.</p>
          </div>
            <span className="text-sm font-medium text-gray-500">{filteredInfluencers.length} of {influencers.length} shown</span>
          </div>
          {!isLoadingInfluencers && influencers.length > 0 && (
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <AdminFilterSearch label="Search influencers" value={influencerSearch} onChange={(event) => setInfluencerSearch(event.target.value)} placeholder="Name, email or prefix" />
              <AdminFilterSelect label="Account status" aria-label="Influencer status filter" value={influencerStatusFilter} onChange={(event) => setInfluencerStatusFilter(event.target.value)}>
                <option value="ALL">All statuses</option>
                {influencerStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </AdminFilterSelect>
            </div>
          )}
        </div>

        {influencerStatus.type !== 'idle' && (
          <div className="mb-5">
            <AdminNotice type={influencerStatus.type} message={influencerStatus.message} />
          </div>
        )}

        {isLoadingInfluencers ? (
          <AdminLoadingState label="Loading influencers..." />
        ) : influencers.length === 0 ? (
          <AdminEmptyState
            title="No influencers yet"
            description="Approve an affiliate application or create an influencer account to get started."
            compact
          />
        ) : filteredInfluencers.length === 0 ? (
          <AdminEmptyState title="No influencers match these filters" description="Change the search or status filter to see more partners." action={{ label: 'Clear filters', onClick: () => { setInfluencerSearch(''); setInfluencerStatusFilter('ALL'); } }} compact />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Prefix</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Commission</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Promo Codes</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInfluencers.map((inf) => (
                  <tr key={inf.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-semibold text-gray-900">{inf.user.name || '—'}</td>
                    <td className="px-6 py-3 text-gray-700">{inf.user.email}</td>
                    <td className="px-6 py-3 font-mono text-purple-700 font-semibold">{inf.defaultPrefix}</td>
                    <td className="px-6 py-3 text-gray-900 font-semibold">{(Number(inf.commissionRate) * 100).toFixed(1)}%</td>
                    <td className="px-6 py-3 text-gray-900 font-semibold">{inf._count?.promoCodes ?? 0}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          inf.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {inf.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={`/admin/promo-users/${inf.id}`}
                        className="inline-flex rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-purple-700"
                      >
                        View details
                      </Link>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <AccountModal
        isOpen={isInfluencerModalOpen}
        mode={influencerModalMode}
        onClose={() => setIsInfluencerModalOpen(false)}
        onModeChange={setInfluencerModalMode}
        onAuthSuccess={handleInfluencerAuthSuccess}
        preSelectInfluencer={true}
      />
    </div>
  );
}
