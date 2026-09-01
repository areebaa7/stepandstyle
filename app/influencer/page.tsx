'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOrderStatusLabel } from '@/lib/orderStatus';

interface DashboardData {
  profile: {
    id: string;
    defaultPrefix: string;
    commissionRate: number;
    status: string;
    user: {
      name: string | null;
      email: string;
    };
  };
  metrics: {
    totalOrders: number;
    grossSales: number;
    totalDiscount: number;
    estimatedCommission: number;
    promoCodeCount: number;
  };
  promoCodes: Array<{
    id: string;
    code: string;
    discountPercent: number;
    validUntil: string;
    usageCount: number;
    totalGrossSales: string;
    totalDiscount: string;
    _count: {
      orders: number;
    };
  }>;
  orders: Array<{
    id: string;
    subtotal: string;
    discountAmount: string;
    total: string;
    status: string;
    commissionEligible: boolean;
    createdAt: string;
    promoCode: {
      code: string;
    } | null;
  }>;
}

export default function InfluencerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedItem(key);
      window.setTimeout(() => setCopiedItem((current) => current === key ? null : current), 2000);
    } catch {
      setCopiedItem(null);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch('/api/influencer/dashboard', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load dashboard');
        }
        setData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <p className="text-lg font-semibold text-red-500">{error || 'Dashboard unavailable'}</p>
        <Link href="/" className="text-purple-600 hover:text-purple-700 font-medium">
          ← Back to Store
        </Link>
      </div>
    );
  }

  const { profile, metrics, promoCodes, orders } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Influencer Header */}
      <header className="bg-[#A855F7] shadow-lg shadow-purple-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center space-x-2 md:space-x-4">
              <h1 className="text-sm md:text-2xl font-black uppercase tracking-tight md:tracking-tighter text-white/90 max-w-[150px] md:max-w-none">
                Influencer Dashboard
              </h1>
            </div>
            <div className="flex items-center shrink-0">
              <Link
                href="/"
                className="text-[10px] md:text-sm font-black uppercase tracking-widest text-white/80 hover:text-white transition-colors bg-transparent px-3 py-2 rounded-lg md:bg-transparent md:px-0 md:py-0"
              >
                <span className="hidden md:inline">← Back to Store</span>
                <span className="md:hidden">Store</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12 space-y-6 md:space-y-12">
        {/* Profile Welcome */}
        <section className="bg-white p-6 md:p-10 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-600 mb-2">Welcome Back</p>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">
            {profile.user.name || profile.user.email.split('@')[0]}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Account Status: {profile.status}</p>
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="grid gap-3 md:gap-5 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <MetricCard label="Orders" value={metrics.totalOrders.toString()} />
          <MetricCard label="Gross Sales" value={`Rs. ${Math.round(metrics.grossSales)}`} />
          <MetricCard label="Discount" value={`Rs. ${Math.round(metrics.totalDiscount)}`} />
          <MetricCard
            label="Commission"
            value={`Rs. ${Math.round(metrics.estimatedCommission)}`}
            accent
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {/* Promo Codes */}
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight">Promo Codes</h2>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Campaign Referrals</p>
              </div>
              <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                {metrics.promoCodeCount} Active
              </span>
            </div>

            {promoCodes.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No active codes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {promoCodes.map((code) => (
                  <div key={code.id} className="group bg-gray-50/50 hover:bg-white border border-gray-100 hover:border-purple-100 hover:shadow-md rounded-2xl p-4 md:p-6 transition-all">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-mono text-base md:text-lg font-black text-purple-700 tracking-wider">{code.code}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                          {code.discountPercent}% Off • {code._count.orders} Orders
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Expires</p>
                        <p className="text-[11px] font-bold text-gray-900">{new Date(code.validUntil).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                      <button
                        type="button"
                        onClick={() => copyText(`code:${code.code}`, code.code)}
                        className="rounded-full border border-purple-100 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-purple-700 hover:bg-purple-50"
                      >
                        {copiedItem === `code:${code.code}` ? 'Code copied' : 'Copy code'}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(
                          `link:${code.code}`,
                          `${window.location.origin}/promo/${encodeURIComponent(code.code)}`,
                        )}
                        className="rounded-full bg-purple-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-purple-700"
                      >
                        {copiedItem === `link:${code.code}` ? 'Link copied' : 'Copy referral link'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight">Recent Orders</h2>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Last 20 Activities</p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                {orders.map((order) => (
                  <div key={order.id} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 md:p-6 hover:bg-white transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Order #{order.id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                          {new Date(order.createdAt).toLocaleDateString()} • {order.promoCode?.code || '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-gray-900">Rs. {Math.round(Number(order.total))}</p>
                        <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mt-0.5">
                          {order.commissionEligible
                            ? `Comm: Rs. ${Math.round(Number(order.total) * Number(profile.commissionRate))}`
                            : 'Commission pending'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.15em] ${order.commissionEligible
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                          }`}
                      >
                        {getOrderStatusLabel(order.status)}
                      </span>
                      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                        {order.commissionEligible ? 'Commission eligible' : order.status === 'CANCELLED' ? 'Commission reversed' : 'Awaiting eligible status'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl md:rounded-3xl border p-4 md:p-8 transition-all hover:scale-[1.02] ${accent
        ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-transparent shadow-lg shadow-purple-100'
        : 'bg-white border-gray-100 shadow-sm'
        }`}
    >
      <p className={`text-[9px] md:text-xs font-black uppercase tracking-[0.2em] ${accent ? 'text-white/80' : 'text-gray-400'}`}>{label}</p>
      <p className="text-lg md:text-3xl font-black mt-2 md:mt-4 truncate tracking-tight">{value}</p>
    </div>
  );
}
