'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getOrderStatusLabel } from '@/lib/orderStatus';
import {
  ArrowLeft,
  BadgePercent,
  Banknote,
  CheckCircle2,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Save,
  ShoppingBag,
  TicketPercent,
  TrendingUp,
  UserRound,
} from 'lucide-react';

type InfluencerStatus = 'ACTIVE' | 'SUSPENDED';
type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

interface InfluencerDetail {
  profile: {
    id: string;
    userId: string;
    name: string | null;
    email: string;
    emailVerifiedAt: string | null;
    defaultPrefix: string;
    commissionRate: number;
    status: InfluencerStatus;
    createdAt: string;
    updatedAt: string;
    userCreatedAt: string;
  };
  application: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    channelLink1: string;
    channelLink2: string | null;
    notes: string | null;
    reviewedAt: string | null;
    createdAt: string;
  } | null;
  summary: {
    totalPromoCodes: number;
    activePromoCodes: number;
    totalOrders: number;
    completedOrders: number;
    activeOrders: number;
    cancelledOrders: number;
    attributedRevenue: number;
    completedRevenue: number;
    totalDiscount: number;
    earnedCommission: number;
    pendingCommission: number;
    averageOrderValue: number;
    completionRate: number;
  };
  promoCodes: Array<{
    id: string;
    code: string;
    prefix: string | null;
    discountPercent: number;
    validUntil: string;
    usageCount: number;
    totalGrossSales: number;
    totalDiscount: number;
    createdAt: string;
    isExpired: boolean;
    orderCount: number;
    completedOrderCount: number;
    revenue: number;
    commission: number;
  }>;
  orders: Array<{
    id: string;
    promoCode: string;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    total: number;
    status: OrderStatus;
    paymentMethod: string;
    paymentStatus: string;
    shippingName: string;
    shippingEmail: string;
    shippingCity: string;
    createdAt: string;
  }>;
  monthlyPerformance: Array<{
    key: string;
    label: string;
    orders: number;
    revenue: number;
    commission: number;
  }>;
}

const currency = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat('en-PK');

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusClasses(status: string) {
  if (status === 'ACTIVE' || status === 'APPROVED' || status === 'COMPLETED') {
    return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
  }
  if (status === 'SUSPENDED' || status === 'REJECTED' || status === 'CANCELLED') {
    return 'bg-rose-100 text-rose-700 ring-rose-200';
  }
  if (status === 'SHIPPED' || status === 'PAID') {
    return 'bg-blue-100 text-blue-700 ring-blue-200';
  }
  return 'bg-amber-100 text-amber-700 ring-amber-200';
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${statusClasses(status)}`}>
      {getOrderStatusLabel(status)}
    </span>
  );
}

export default function PromoUserDetailPage() {
  const params = useParams();
  const influencerId = String(params.id || '');
  const [activeTab, setActiveTab] = useState<'overview' | 'codes' | 'sales' | 'analytics'>('overview');
  const [data, setData] = useState<InfluencerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ name: '', defaultPrefix: '', commissionPercent: '10' });

  const loadDetail = useCallback(async () => {
    if (!influencerId) return;
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`/api/promo-users/${encodeURIComponent(influencerId)}`, {
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load influencer detail.');
      }
      const detail = payload.data as InfluencerDetail;
      setData(detail);
      setForm({
        name: detail.profile.name || '',
        defaultPrefix: detail.profile.defaultPrefix,
        commissionPercent: String(Number(detail.profile.commissionRate) * 100),
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load influencer detail.');
    } finally {
      setIsLoading(false);
    }
  }, [influencerId]);

  useEffect(() => {
    // This effect intentionally hydrates the page from the selected profile API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDetail();
  }, [loadDetail]);

  const updateProfile = async (changes: Record<string, unknown>, successMessage: string) => {
    try {
      setIsSaving(true);
      setNotice(null);
      const response = await fetch(`/api/promo-users/${encodeURIComponent(influencerId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to update influencer.');
      }
      await loadDetail();
      setNotice({ type: 'success', text: successMessage });
    } catch (saveError) {
      setNotice({
        type: 'error',
        text: saveError instanceof Error ? saveError.message : 'Unable to update influencer.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfile = async () => {
    const commissionPercent = Number(form.commissionPercent);
    if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
      setNotice({ type: 'error', text: 'Commission must be between 0% and 100%.' });
      return;
    }
    await updateProfile(
      {
        name: form.name,
        defaultPrefix: form.defaultPrefix,
        commissionRate: commissionPercent / 100,
      },
      'Profile settings saved.',
    );
  };

  const maxMonthlyRevenue = useMemo(
    () => Math.max(1, ...(data?.monthlyPerformance.map((month) => month.revenue) ?? [1])),
    [data],
  );

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-slate-50 px-5 py-20">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-16 rounded-2xl bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 rounded-2xl bg-slate-200" />)}
          </div>
          <div className="h-96 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-5">
        <div className="max-w-md rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-lg">
          <p className="text-lg font-bold text-slate-900">Unable to open influencer</p>
          <p className="mt-2 text-sm text-slate-500">{error || 'Influencer profile not found.'}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/admin" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Back</Link>
            <button type="button" onClick={() => void loadDetail()} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const { profile, summary, promoCodes, orders, application, monthlyPerformance } = data;
  const initials = (profile.name || profile.email).split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const statCards = [
    { label: 'Completed revenue', value: currency.format(summary.completedRevenue), icon: Banknote, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Attributed orders', value: number.format(summary.totalOrders), icon: ShoppingBag, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Earned commission', value: currency.format(summary.earnedCommission), icon: TrendingUp, tone: 'bg-purple-50 text-purple-700' },
    { label: 'Active promo codes', value: `${summary.activePromoCodes} / ${summary.totalPromoCodes}`, icon: TicketPercent, tone: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-purple-500/30 bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/admin" aria-label="Back to admin" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/15 transition hover:bg-white/25">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-lg font-black text-purple-700 shadow-md">{initials}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{profile.name || 'Unnamed Influencer'}</h1>
                <StatusBadge status={profile.status} />
              </div>
              <p className="mt-1 truncate text-sm text-purple-100">{profile.email} · {profile.defaultPrefix}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void updateProfile(
              { status: profile.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' },
              profile.status === 'ACTIVE' ? 'Influencer suspended.' : 'Influencer activated.',
            )}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition disabled:opacity-60 ${profile.status === 'ACTIVE' ? 'bg-white text-rose-600 hover:bg-rose-50' : 'bg-emerald-500 text-white hover:bg-emerald-400'}`}
          >
            {profile.status === 'ACTIVE' ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
            {profile.status === 'ACTIVE' ? 'Suspend account' : 'Activate account'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {notice && (
          <div className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {notice.text}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${stat.tone}`}><Icon className="h-5 w-5" /></div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{stat.value}</p>
              </article>
            );
          })}
        </div>

        <nav className="mt-8 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {[
            ['overview', 'Overview'],
            ['codes', `Promo Codes (${promoCodes.length})`],
            ['sales', `Sales (${orders.length})`],
            ['analytics', 'Performance'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold transition ${activeTab === id ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-purple-50 hover:text-purple-700'}`}
            >
              {label}
            </button>
          ))}
          <button type="button" onClick={() => void loadDetail()} className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Refresh detail">
            <RefreshCw className="h-4 w-4" />
          </button>
        </nav>

        <section className="mt-5">
          {activeTab === 'overview' && (
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <UserRound className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-black">Profile settings</h2>
                </div>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-bold text-slate-700">
                    Display name
                    <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100" />
                  </label>
                  <label className="text-sm font-bold text-slate-700">
                    Default code prefix
                    <input value={form.defaultPrefix} onChange={(event) => setForm((current) => ({ ...current, defaultPrefix: event.target.value.toUpperCase() }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono font-bold outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100" />
                  </label>
                  <label className="text-sm font-bold text-slate-700">
                    Commission percentage
                    <div className="relative mt-2">
                      <input type="number" min="0" max="100" step="0.1" value={form.commissionPercent} onChange={(event) => setForm((current) => ({ ...current, commissionPercent: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 font-bold outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100" />
                      <span className="absolute right-4 top-3 text-slate-400">%</span>
                    </div>
                  </label>
                  <div className="rounded-xl bg-slate-50 p-4 text-sm">
                    <p className="font-bold text-slate-700">Account email</p>
                    <a href={`mailto:${profile.email}`} className="mt-2 block truncate text-purple-600 hover:underline">{profile.email}</a>
                    <p className="mt-1 text-xs text-slate-400">{profile.emailVerifiedAt ? `Verified ${formatDate(profile.emailVerifiedAt)}` : 'Email not verified'}</p>
                  </div>
                </div>
                <button type="button" disabled={isSaving} onClick={() => void saveProfile()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-700 disabled:opacity-60">
                  <Save className="h-4 w-4" /> {isSaving ? 'Saving…' : 'Save profile'}
                </button>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-black">Account details</h2>
                  <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div><dt className="text-slate-400">Joined</dt><dd className="mt-1 font-bold">{formatDate(profile.createdAt)}</dd></div>
                    <div><dt className="text-slate-400">Last updated</dt><dd className="mt-1 font-bold">{formatDate(profile.updatedAt)}</dd></div>
                    <div><dt className="text-slate-400">Active orders</dt><dd className="mt-1 font-bold">{summary.activeOrders}</dd></div>
                    <div><dt className="text-slate-400">Cancelled</dt><dd className="mt-1 font-bold">{summary.cancelledOrders}</dd></div>
                    <div><dt className="text-slate-400">Pending commission</dt><dd className="mt-1 font-bold text-amber-600">{currency.format(summary.pendingCommission)}</dd></div>
                    <div><dt className="text-slate-400">Discount delivered</dt><dd className="mt-1 font-bold">{currency.format(summary.totalDiscount)}</dd></div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-black">Affiliate application</h2>
                    {application && <StatusBadge status={application.status} />}
                  </div>
                  {application ? (
                    <div className="mt-5 space-y-3 text-sm">
                      {[application.channelLink1, application.channelLink2].filter(Boolean).map((link) => (
                        <a key={link} href={link!} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 font-semibold text-purple-600 hover:bg-purple-50">
                          <span className="truncate">{link}</span><ExternalLink className="h-4 w-4 shrink-0" />
                        </a>
                      ))}
                      <p className="text-xs text-slate-400">Applied {formatDate(application.createdAt)} · Reviewed {formatDate(application.reviewedAt)}</p>
                      {application.notes && <p className="rounded-xl bg-amber-50 p-3 text-amber-800">{application.notes}</p>}
                    </div>
                  ) : <p className="mt-4 text-sm text-slate-500">This account was created directly by an admin; no affiliate application is linked.</p>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'codes' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6"><h2 className="text-xl font-black">Assigned promo codes</h2><p className="mt-1 text-sm text-slate-500">Validity, attributed orders, revenue and commission per code.</p></div>
              {promoCodes.length === 0 ? (
                <div className="p-12 text-center"><BadgePercent className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-bold text-slate-700">No promo codes assigned</p><p className="mt-1 text-sm text-slate-400">Create a code from the Promo Users section.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4">Code</th><th className="px-6 py-4">Discount</th><th className="px-6 py-4">Validity</th><th className="px-6 py-4">Orders</th><th className="px-6 py-4">Revenue</th><th className="px-6 py-4">Commission</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {promoCodes.map((code) => (
                        <tr key={code.id} className="hover:bg-slate-50"><td className="px-6 py-4"><span className="rounded-lg bg-purple-50 px-3 py-2 font-mono font-black text-purple-700">{code.code}</span></td><td className="px-6 py-4 font-bold">{code.discountPercent}%</td><td className="px-6 py-4"><p className="font-semibold">{formatDate(code.validUntil)}</p><span className={`text-xs font-bold ${code.isExpired ? 'text-rose-500' : 'text-emerald-600'}`}>{code.isExpired ? 'Expired' : 'Active'}</span></td><td className="px-6 py-4"><p className="font-bold">{code.completedOrderCount} completed</p><p className="text-xs text-slate-400">{code.orderCount} attributed</p></td><td className="px-6 py-4 font-bold">{currency.format(code.revenue)}</td><td className="px-6 py-4 font-bold text-purple-700">{currency.format(code.commission)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-6"><h2 className="text-xl font-black">Attributed sales</h2><p className="mt-1 text-sm text-slate-500">Every order placed using this influencer’s promo codes.</p></div>
              {orders.length === 0 ? (
                <div className="p-12 text-center"><ShoppingBag className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-bold text-slate-700">No attributed orders yet</p><p className="mt-1 text-sm text-slate-400">Orders will appear here after a promo code is used.</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4">Order</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Promo code</th><th className="px-6 py-4">Total</th><th className="px-6 py-4">Payment</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Date</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50"><td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{order.id.slice(-10).toUpperCase()}</td><td className="px-6 py-4"><p className="font-bold">{order.shippingName}</p><p className="text-xs text-slate-400">{order.shippingEmail} · {order.shippingCity}</p></td><td className="px-6 py-4 font-mono font-bold text-purple-700">{order.promoCode}</td><td className="px-6 py-4"><p className="font-bold">{currency.format(order.total)}</p><p className="text-xs text-emerald-600">-{currency.format(order.discountAmount)}</p></td><td className="px-6 py-4"><p className="font-semibold">{order.paymentMethod}</p><p className="text-xs text-slate-400">{order.paymentStatus}</p></td><td className="px-6 py-4"><StatusBadge status={order.status} /></td><td className="px-6 py-4 font-semibold">{formatDate(order.createdAt)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                  <p className="mt-4 text-sm font-bold text-slate-500">Order completion rate</p>
                  <p className="mt-2 text-4xl font-black">{summary.completionRate.toFixed(1)}%</p>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, summary.completionRate)}%` }} /></div>
                  <p className="mt-3 text-xs text-slate-400">{summary.completedOrders} of {summary.totalOrders} attributed orders completed</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-bold text-slate-500">Average completed order</p><p className="mt-2 text-3xl font-black">{currency.format(summary.averageOrderValue)}</p>
                  <p className="mt-5 text-sm font-bold text-slate-500">Current commission rate</p><p className="mt-2 text-3xl font-black text-purple-700">{(Number(profile.commissionRate) * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">Last six months</h2><p className="mt-1 text-sm text-slate-500">Completed order revenue and commission.</p>
                <div className="mt-8 space-y-5">
                  {monthlyPerformance.map((month) => (
                    <div key={month.key} className="grid grid-cols-[72px_1fr_auto] items-center gap-4">
                      <div><p className="text-sm font-black text-slate-700">{month.label}</p><p className="text-xs text-slate-400">{month.orders} orders</p></div>
                      <div className="h-11 overflow-hidden rounded-xl bg-slate-100"><div className="flex h-full min-w-[2px] items-center rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-3 text-xs font-bold text-white transition-all" style={{ width: `${Math.max(2, (month.revenue / maxMonthlyRevenue) * 100)}%` }}>{month.revenue > 0 ? currency.format(month.revenue) : ''}</div></div>
                      <p className="w-24 text-right text-xs font-bold text-purple-700">{currency.format(month.commission)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
