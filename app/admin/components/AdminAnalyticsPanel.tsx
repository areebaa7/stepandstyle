'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AdminEmptyState as SharedAdminEmptyState, AdminErrorState } from './AdminAsyncState';

type AnalyticsRange = '6m' | '12m' | 'all';

interface TrafficData {
  activeUsers: string;
  weeklyUsers: string;
  weeklyPageViews: string;
  chartData?: { date: string; users: number; views: number }[];
  status: string;
}

interface AnalyticsSummary {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  grossRevenue: number;
  totalDiscounts: number;
  grossProfit: number;
  totalCommission: number;
  netRevenue: number;
  ordersToday: number;
  netProfitToday: number;
}

interface InfluencerSummary {
  totalInfluencers: number;
  activeInfluencers: number;
  attributedOrders: number;
  completedOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  attributedRevenue: number;
  pendingAttributedRevenue: number;
  earnedCommission: number;
  pendingCommission: number;
  averageOrderValue: number;
  completionRate: number;
  revenueShare: number;
}

interface InfluencerStat {
  influencerId: string;
  userId: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED';
  commissionRate: number;
  promoCodes: string[];
  attributedOrders: number;
  completedOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  attributedRevenue: number;
  completedRevenue: number;
  earnedCommission: number;
  pendingCommission: number;
  averageOrderValue: number;
  completionRate: number;
  lastSaleAt: string | null;
}

interface PromoCodeStat {
  id: string;
  code: string;
  influencerId: string;
  influencerName: string;
  attributedOrders: number;
  completedOrders: number;
  completedRevenue: number;
  earnedCommission: number;
}

interface RecentSale {
  id: string;
  influencerId: string;
  influencerName: string;
  promoCode: string;
  customerName: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface AnalyticsPayload {
  range: AnalyticsRange;
  rangeStart: string | null;
  summary: AnalyticsSummary;
  influencerSummary: InfluencerSummary;
  trend: { key: string; label: string; orders: number; revenue: number; commission: number }[];
  trendIsLimited: boolean;
  influencers: InfluencerStat[];
  topPromoCodes: PromoCodeStat[];
  recentSales: RecentSale[];
}

async function readAnalyticsJson<T>(response: Response, label: string): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();

  if (!contentType.toLowerCase().includes('application/json')) {
    const statusDetail = response.status ? ` (HTTP ${response.status})` : '';
    throw new Error(`${label} returned an unexpected server response${statusDetail}. Please retry after the server refreshes.`);
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(`${label} returned invalid data. Please retry.`);
  }
}

const currencyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-PK');

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : 'No sales yet';

const statusClass = (status: string) => {
  if (status === 'COMPLETED' || status === 'APPROVED' || status === 'ACTIVE') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  }
  if (status === 'CANCELLED' || status === 'DISAPPROVED' || status === 'SUSPENDED') {
    return 'bg-rose-50 text-rose-700 ring-rose-200';
  }
  return 'bg-amber-50 text-amber-700 ring-amber-200';
};

export default function AdminAnalyticsPanel() {
  const [range, setRange] = useState<AnalyticsRange>('12m');
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [trafficDays, setTrafficDays] = useState(7);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrafficLoading, setIsTrafficLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/analytics?range=${range}`, { cache: 'no-store' });
      const payload = await readAnalyticsJson<{ success?: boolean; data?: AnalyticsPayload; error?: string }>(
        response,
        'Analytics',
      );
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || 'Failed to load analytics.');
      }
      setData(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    // Loading is intentionally tied to the selected reporting range.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    const loadTraffic = async () => {
      try {
        setIsTrafficLoading(true);
        const response = await fetch(`/api/admin/analytics/traffic?days=${trafficDays}`, {
          cache: 'no-store',
        });
        const payload = await readAnalyticsJson<TrafficData & { error?: string }>(response, 'Traffic analytics');
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load traffic analytics.');
        }
        setTrafficData(payload);
      } catch {
        setTrafficData({
          activeUsers: 'N/A',
          weeklyUsers: 'N/A',
          weeklyPageViews: 'N/A',
          status: 'Temporarily unavailable',
        });
      } finally {
        setIsTrafficLoading(false);
      }
    };

    void loadTraffic();
  }, [trafficDays]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-purple-700 to-fuchsia-600 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-100">Affiliate reporting</p>
          <h2 className="mt-1 text-2xl font-black">Influencer Sales & Commission Analytics</h2>
          <p className="mt-1 max-w-2xl text-sm text-purple-100">
            Completed orders count as earned commission. Open orders remain pending until delivery.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as AnalyticsRange)}
            className="rounded-lg border border-white/30 bg-white px-3 py-2 text-sm font-bold text-purple-800 outline-none ring-purple-200 focus:ring-2"
            aria-label="Analytics date range"
          >
            <option value="6m">Last 6 months</option>
            <option value="12m">Last 12 months</option>
            <option value="all">All time</option>
          </select>
          <button
            type="button"
            onClick={() => void loadAnalytics()}
            disabled={isLoading}
            className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-60"
          >
            {isLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <AdminErrorState message={error} onRetry={() => void loadAnalytics()} />
      )}

      {isLoading && !data ? (
        <AnalyticsSkeleton />
      ) : data ? (
        <>
          <InfluencerOverview summary={data.influencerSummary} />

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Completed revenue trend</h3>
                <p className="text-sm text-gray-500">Only delivered influencer orders and earned commission.</p>
              </div>
              <p className="text-xs font-semibold text-gray-400">
                {data.trendIsLimited ? 'All-time totals; chart shows latest 36 months' : 'Selected period'}
              </p>
            </div>
            <div className="h-[310px] min-w-0 w-full">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 700, height: 310 }}>
                <AreaChart data={data.trend} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="influencerRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="influencerCommission" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={72}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(value) => `${numberFormatter.format(Number(value) / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value) => currencyFormatter.format(Number(value))}
                    contentStyle={{ borderRadius: 12, borderColor: '#e5e7eb' }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#7c3aed" strokeWidth={3} fill="url(#influencerRevenue)" />
                  <Area type="monotone" dataKey="commission" name="Commission" stroke="#ec4899" strokeWidth={3} fill="url(#influencerCommission)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <InfluencerTable influencers={data.influencers} />

          <div className="grid gap-6 xl:grid-cols-2">
            <TopPromoCodes promoCodes={data.topPromoCodes} />
            <RecentSales sales={data.recentSales} />
          </div>

          <StoreSummary summary={data.summary} />
        </>
      ) : null}

      {trafficData && (
        <TrafficSection
          data={trafficData}
          days={trafficDays}
          isLoading={isTrafficLoading}
          onDaysChange={setTrafficDays}
        />
      )}
    </div>
  );
}

function InfluencerOverview({ summary }: { summary: InfluencerSummary }) {
  const cards = [
    { label: 'Completed revenue', value: currencyFormatter.format(summary.attributedRevenue), note: `${summary.completedOrders} delivered sales` },
    { label: 'Earned commission', value: currencyFormatter.format(summary.earnedCommission), note: 'From completed orders' },
    { label: 'Pending commission', value: currencyFormatter.format(summary.pendingCommission), note: `${summary.activeOrders} open orders` },
    { label: 'Completion rate', value: `${summary.completionRate.toFixed(1)}%`, note: `${summary.cancelledOrders} cancelled` },
    { label: 'Average order value', value: currencyFormatter.format(summary.averageOrderValue), note: 'Completed influencer sales' },
    { label: 'Revenue contribution', value: `${summary.revenueShare.toFixed(1)}%`, note: `${summary.activeInfluencers}/${summary.totalInfluencers} influencers active` },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">{card.label}</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{card.value}</p>
          <p className="mt-1 text-xs text-gray-400">{card.note}</p>
        </div>
      ))}
    </section>
  );
}

function InfluencerTable({ influencers }: { influencers: InfluencerStat[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:p-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Influencer performance</h3>
          <p className="text-sm text-gray-500">Comparison includes active, suspended and zero-sale accounts.</p>
        </div>
        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
          {influencers.length} total
        </span>
      </div>
      {influencers.length === 0 ? (
        <EmptyState message="No influencer profiles have been created yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-bold">Influencer</th>
                <th className="px-4 py-3 font-bold">Codes</th>
                <th className="px-4 py-3 font-bold">Orders</th>
                <th className="px-4 py-3 font-bold">Completed revenue</th>
                <th className="px-4 py-3 font-bold">Commission</th>
                <th className="px-4 py-3 font-bold">Conversion</th>
                <th className="px-4 py-3 font-bold">Last sale</th>
                <th className="px-5 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {influencers.map((influencer) => (
                <tr key={influencer.influencerId} className="hover:bg-purple-50/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-purple-100 font-black text-purple-700">
                        {influencer.name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="font-bold text-gray-900">{influencer.name}</p>
                        <p className="text-xs text-gray-500">{influencer.email}</p>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${statusClass(influencer.status)}`}>
                          {influencer.status}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    <p className="max-w-36 truncate" title={influencer.promoCodes.join(', ')}>
                      {influencer.promoCodes.join(', ') || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-900">{numberFormatter.format(influencer.completedOrders)}</p>
                    <p className="text-xs text-gray-400">{influencer.activeOrders} open / {influencer.cancelledOrders} cancelled</p>
                  </td>
                  <td className="px-4 py-4 font-bold text-gray-900">{currencyFormatter.format(influencer.completedRevenue)}</td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-emerald-700">{currencyFormatter.format(influencer.earnedCommission)}</p>
                    <p className="text-xs text-amber-600">{currencyFormatter.format(influencer.pendingCommission)} pending</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-900">{influencer.completionRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-400">Rate {(influencer.commissionRate * 100).toFixed(1)}%</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-500">{formatDate(influencer.lastSaleAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/promo-users/${influencer.influencerId}`} className="font-bold text-purple-700 hover:text-purple-900 hover:underline">
                      View details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TopPromoCodes({ promoCodes }: { promoCodes: PromoCodeStat[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-bold text-gray-900">Top promo codes</h3>
      <p className="mb-4 text-sm text-gray-500">Ranked by completed revenue.</p>
      {promoCodes.length === 0 ? (
        <EmptyState message="No promo-code sales in this period." compact />
      ) : (
        <div className="space-y-3">
          {promoCodes.map((promoCode, index) => (
            <div key={promoCode.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-purple-100 text-xs font-black text-purple-700">#{index + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-gray-900">{promoCode.code}</span>
                  <span className="truncate text-xs text-gray-400">{promoCode.influencerName}</span>
                </div>
                <p className="text-xs text-gray-500">{promoCode.completedOrders}/{promoCode.attributedOrders} completed orders</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{currencyFormatter.format(promoCode.completedRevenue)}</p>
                <p className="text-xs text-emerald-600">{currencyFormatter.format(promoCode.earnedCommission)} commission</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentSales({ sales }: { sales: RecentSale[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-bold text-gray-900">Recent attributed orders</h3>
      <p className="mb-4 text-sm text-gray-500">Latest orders placed with influencer promo codes.</p>
      {sales.length === 0 ? (
        <EmptyState message="No attributed orders in this period." compact />
      ) : (
        <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
          {sales.map((sale) => (
            <div key={sale.id} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-gray-900">{sale.customerName}</p>
                  <p className="truncate text-xs text-gray-500">{sale.influencerName} · {sale.promoCode}</p>
                </div>
                <p className="shrink-0 font-black text-gray-900">{currencyFormatter.format(sale.total)}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${statusClass(sale.status)}`}>{sale.status}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${statusClass(sale.paymentStatus)}`}>{sale.paymentStatus}</span>
                <span className="ml-auto text-[11px] text-gray-400">{formatDate(sale.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StoreSummary({ summary }: { summary: AnalyticsSummary }) {
  const items = [
    ['All store orders', numberFormatter.format(summary.totalOrders)],
    ['Completed orders', numberFormatter.format(summary.completedOrders)],
    ['Open orders', numberFormatter.format(summary.pendingOrders)],
    ['Gross merchandise value', currencyFormatter.format(summary.grossRevenue)],
    ['Discounts', currencyFormatter.format(summary.totalDiscounts)],
    ['Net after influencer commission', currencyFormatter.format(summary.netRevenue)],
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900">Store context</h3>
      <p className="mb-4 text-sm text-gray-500">Use these totals to compare influencer contribution with overall completed sales.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-1 text-lg font-black text-gray-900">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrafficSection({
  data,
  days,
  isLoading,
  onDaysChange,
}: {
  data: TrafficData;
  days: number;
  isLoading: boolean;
  onDaysChange: (days: number) => void;
}) {
  return (
    <section className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-purple-950">Website traffic</h3>
          <p className="text-sm text-purple-700/80">Google Analytics 4 visitor context.</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={days} onChange={(event) => onDaysChange(Number(event.target.value))} className="rounded-lg border border-purple-200 bg-white px-2.5 py-1.5 text-sm font-bold text-purple-800 outline-none">
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={28}>Last 28 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <span className="flex items-center gap-2 text-xs font-bold text-purple-800">
            <span className={`h-2.5 w-2.5 rounded-full ${data.status === 'Connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {data.status}
          </span>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <TrafficCard label="Active users (30m)" value={isLoading ? '…' : data.activeUsers} />
          <TrafficCard label={`Users (${days} days)`} value={isLoading ? '…' : data.weeklyUsers} />
        </div>
        <div className="h-[270px] min-w-0 rounded-xl bg-white/70 p-4 lg:col-span-3">
          {isLoading ? (
            <div className="grid h-full place-items-center text-sm font-bold text-purple-400">Loading traffic…</div>
          ) : data.chartData?.length ? (
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 270 }}>
              <AreaChart data={data.chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trafficUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9d5ff" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7e22ce' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7e22ce' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 0 }} />
                <Area type="monotone" dataKey="views" name="Page Views" stroke="#ec4899" strokeWidth={2} fillOpacity={0} />
                <Area type="monotone" dataKey="users" name="Users" stroke="#9333ea" strokeWidth={3} fill="url(#trafficUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-sm font-bold text-purple-400">No traffic data available.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function TrafficCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white bg-white/70 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-purple-600">{label}</p>
      <p className="mt-2 text-4xl font-black text-purple-950">{value}</p>
    </div>
  );
}

function EmptyState({ message, compact = false }: { message: string; compact?: boolean }) {
  return <SharedAdminEmptyState title={message} compact={compact} />;
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading analytics" data-admin-state="loading">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-gray-100" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-gray-100" />
    </div>
  );
}
