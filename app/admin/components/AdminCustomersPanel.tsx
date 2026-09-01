'use client';

import { useCallback, useEffect, useState } from 'react';
import { getOrderStatusLabel } from '@/lib/orderStatus';
import { AdminEmptyState, AdminErrorState, AdminNotice } from './AdminAsyncState';

type VerificationFilter = 'ALL' | 'VERIFIED' | 'UNVERIFIED';
type CustomerSort = 'LATEST' | 'OLDEST' | 'SPEND' | 'ORDERS' | 'NAME';

interface CustomerSummary {
  totalCustomers: number;
  verifiedCustomers: number;
  customersWithOrders: number;
  newThisMonth: number;
  lifetimeRevenue: number;
}

interface CustomerListItem {
  id: string;
  name: string | null;
  email: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  completedOrders: number;
  openOrders: number;
  addressCount: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt: string | null;
}

interface CustomerDetail {
  profile: {
    id: string;
    name: string | null;
    email: string;
    emailVerifiedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  summary: {
    totalOrders: number;
    completedOrders: number;
    openOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    addressCount: number;
    cartItemCount: number;
    wishlistItemCount: number;
  };
  addresses: Array<{
    id: string;
    label: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    region: string;
    postalCode: string | null;
    isDefault: boolean;
  }>;
  orders: Array<{
    id: string;
    total: number;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    shippingName: string;
    shippingEmail: string;
    shippingPhone: string;
    shippingCity: string;
    shippingRegion: string;
    createdAt: string;
    promoCode: { code: string } | null;
  }>;
  cart: { itemCount: number; promoCode: string; updatedAt: string } | null;
  wishlist: { itemCount: number; updatedAt: string } | null;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const emptySummary: CustomerSummary = {
  totalCustomers: 0,
  verifiedCustomers: 0,
  customersWithOrders: 0,
  newThisMonth: 0,
  lifetimeRevenue: 0,
};

const currencyFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-PK');

function formatDate(value: string | null) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (['COMPLETED', 'APPROVED', 'PAID'].includes(status)) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  }
  if (['CANCELLED', 'DISAPPROVED'].includes(status)) {
    return 'bg-rose-50 text-rose-700 ring-rose-200';
  }
  if (status === 'SHIPPED') return 'bg-blue-50 text-blue-700 ring-blue-200';
  return 'bg-amber-50 text-amber-700 ring-amber-200';
}

export default function AdminCustomersPanel() {
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [summary, setSummary] = useState<CustomerSummary>(emptySummary);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [verification, setVerification] = useState<VerificationFilter>('ALL');
  const [sort, setSort] = useState<CustomerSort>('LATEST');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        verification,
        sort,
      });
      if (search) params.set('search', search);
      const response = await fetch(`/api/admin/customers?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load customers.');
      }
      setCustomers(payload.data || []);
      setSummary(payload.summary || emptySummary);
      setPagination(payload.pagination);
      if (payload.pagination?.page && payload.pagination.page !== page) {
        setPage(payload.pagination.page);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load customers.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, sort, verification]);

  useEffect(() => {
    // Customer data is intentionally synchronized with list filters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCustomers();
  }, [loadCustomers]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  };

  const openCustomer = async (id: string) => {
    try {
      setIsDetailLoading(true);
      setDetailError('');
      setNotice(null);
      setSelectedCustomer(null);
      const response = await fetch(`/api/admin/customers/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load customer detail.');
      }
      setSelectedCustomer(payload.data);
    } catch (loadError) {
      setDetailError(loadError instanceof Error ? loadError.message : 'Failed to load customer detail.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetail = () => {
    if (actionLoading) return;
    setSelectedCustomer(null);
    setDetailError('');
    setIsDetailLoading(false);
  };

  const sendCustomerEmail = async (action: 'SEND_VERIFICATION' | 'SEND_PASSWORD_RESET') => {
    if (!selectedCustomer) return;
    const label = action === 'SEND_VERIFICATION' ? 'verification email' : 'password reset email';
    if (!window.confirm(`Send a ${label} to ${selectedCustomer.profile.email}?`)) return;

    try {
      setActionLoading(action);
      setNotice(null);
      const response = await fetch(`/api/admin/customers/${selectedCustomer.profile.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || `Failed to send ${label}.`);
      }
      setNotice({ type: 'success', message: payload.message });
    } catch (actionError) {
      setNotice({
        type: 'error',
        message: actionError instanceof Error ? actionError.message : `Failed to send ${label}.`,
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">Registered accounts</p>
          <h2 className="mt-1 text-2xl font-black text-gray-900">Customer Management</h2>
          <p className="text-sm text-gray-500">Search customers and review their account, order and spending history.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadCustomers()}
          disabled={isLoading}
          className="self-start rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 transition hover:bg-purple-100 disabled:opacity-60 sm:self-auto"
        >
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <SummaryCards summary={summary} />

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-gray-100 p-4 lg:grid-cols-[1fr_auto_auto] lg:p-5">
          <form onSubmit={submitSearch} className="flex min-w-0 gap-2">
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search by customer name or email"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
            <button type="submit" className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-purple-700">
              Search
            </button>
          </form>
          <select
            value={verification}
            onChange={(event) => {
              setPage(1);
              setVerification(event.target.value as VerificationFilter);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-purple-500"
            aria-label="Email verification filter"
          >
            <option value="ALL">All verification states</option>
            <option value="VERIFIED">Verified only</option>
            <option value="UNVERIFIED">Unverified only</option>
          </select>
          <select
            value={sort}
            onChange={(event) => {
              setPage(1);
              setSort(event.target.value as CustomerSort);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-purple-500"
            aria-label="Customer sort order"
          >
            <option value="LATEST">Newest accounts</option>
            <option value="OLDEST">Oldest accounts</option>
            <option value="SPEND">Highest spend</option>
            <option value="ORDERS">Most orders</option>
            <option value="NAME">Name A–Z</option>
          </select>
        </div>

        {error ? (
          <div className="p-5">
            <AdminErrorState message={error} onRetry={() => void loadCustomers()} />
          </div>
        ) : isLoading ? (
          <CustomerTableSkeleton />
        ) : customers.length === 0 ? (
          <div className="p-5">
            <AdminEmptyState
              title="No matching customers"
              description="Change the search, verification filter, or sorting selection."
              compact
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[940px] w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-bold">Customer</th>
                  <th className="px-4 py-3 font-bold">Verification</th>
                  <th className="px-4 py-3 font-bold">Orders</th>
                  <th className="px-4 py-3 font-bold">Completed spend</th>
                  <th className="px-4 py-3 font-bold">Last order</th>
                  <th className="px-4 py-3 font-bold">Joined</th>
                  <th className="px-5 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-purple-50/30">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-purple-100 font-black text-purple-700">
                          {(customer.name || customer.email).charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-gray-900">{customer.name || 'Unnamed customer'}</p>
                          <p className="truncate text-xs text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <VerificationBadge verified={Boolean(customer.emailVerifiedAt)} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-900">{numberFormatter.format(customer.orderCount)}</p>
                      <p className="text-xs text-gray-400">{customer.openOrders} open · {customer.completedOrders} completed</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-gray-900">{currencyFormatter.format(customer.totalSpent)}</p>
                      <p className="text-xs text-gray-400">AOV {currencyFormatter.format(customer.averageOrderValue)}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-500">{formatDate(customer.lastOrderAt)}</td>
                    <td className="px-4 py-4 text-xs text-gray-500">{formatDate(customer.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      <button type="button" onClick={() => void openCustomer(customer.id)} className="font-bold text-purple-700 hover:text-purple-900 hover:underline">
                        View customer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{pagination.total ? `${pagination.total} matching customers` : 'No matching customers'}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 text-xs font-bold">Page {pagination.page} of {pagination.totalPages}</span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 font-bold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {(isDetailLoading || detailError || selectedCustomer) && (
        <CustomerDetailModal
          customer={selectedCustomer}
          isLoading={isDetailLoading}
          error={detailError}
          notice={notice}
          actionLoading={actionLoading}
          onClose={closeDetail}
          onSendEmail={sendCustomerEmail}
        />
      )}
    </div>
  );
}

function SummaryCards({ summary }: { summary: CustomerSummary }) {
  const cards = [
    ['Registered customers', numberFormatter.format(summary.totalCustomers)],
    ['Verified emails', numberFormatter.format(summary.verifiedCustomers)],
    ['Customers with orders', numberFormatter.format(summary.customersWithOrders)],
    ['New this month', numberFormatter.format(summary.newThisMonth)],
    ['Completed lifetime spend', currencyFormatter.format(summary.lifetimeRevenue)],
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500">{label}</p>
          <p className="mt-2 text-xl font-black text-gray-900">{value}</p>
        </div>
      ))}
    </section>
  );
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${verified ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-amber-200'}`}>
      {verified ? 'VERIFIED' : 'UNVERIFIED'}
    </span>
  );
}

function CustomerDetailModal({
  customer,
  isLoading,
  error,
  notice,
  actionLoading,
  onClose,
  onSendEmail,
}: {
  customer: CustomerDetail | null;
  isLoading: boolean;
  error: string;
  notice: { type: 'success' | 'error'; message: string } | null;
  actionLoading: string | null;
  onClose: () => void;
  onSendEmail: (action: 'SEND_VERIFICATION' | 'SEND_PASSWORD_RESET') => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Customer detail">
      <div className="h-full w-full max-w-3xl overflow-y-auto bg-gray-50 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-600">Customer detail</p>
            <h3 className="text-xl font-black text-gray-900">{customer?.profile.name || customer?.profile.email || 'Loading customer…'}</h3>
          </div>
          <button type="button" onClick={onClose} disabled={Boolean(actionLoading)} className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-xl font-bold text-gray-600 hover:bg-gray-200 disabled:opacity-50" aria-label="Close customer detail">
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4 p-6 animate-pulse">
            <div className="h-40 rounded-2xl bg-gray-200" />
            <div className="h-72 rounded-2xl bg-gray-200" />
          </div>
        ) : error ? (
          <div className="p-5"><AdminErrorState message={error} /></div>
        ) : customer ? (
          <div className="space-y-6 p-5 sm:p-6">
            {notice && (
              <AdminNotice type={notice.type} message={notice.message} />
            )}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xl font-black text-gray-900">{customer.profile.name || 'Unnamed customer'}</h4>
                    <VerificationBadge verified={Boolean(customer.profile.emailVerifiedAt)} />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{customer.profile.email}</p>
                  <p className="mt-2 text-xs text-gray-400">Joined {formatDate(customer.profile.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!customer.profile.emailVerifiedAt && (
                    <button
                      type="button"
                      disabled={Boolean(actionLoading)}
                      onClick={() => void onSendEmail('SEND_VERIFICATION')}
                      className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                    >
                      {actionLoading === 'SEND_VERIFICATION' ? 'Sending…' : 'Send verification'}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={Boolean(actionLoading)}
                    onClick={() => void onSendEmail('SEND_PASSWORD_RESET')}
                    className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    {actionLoading === 'SEND_PASSWORD_RESET' ? 'Sending…' : 'Send password reset'}
                  </button>
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Completed spend', currencyFormatter.format(customer.summary.totalSpent)],
                ['All orders', numberFormatter.format(customer.summary.totalOrders)],
                ['Open orders', numberFormatter.format(customer.summary.openOrders)],
                ['Average order', currencyFormatter.format(customer.summary.averageOrderValue)],
                ['Saved addresses', numberFormatter.format(customer.summary.addressCount)],
                ['Saved items', `${customer.summary.cartItemCount} cart · ${customer.summary.wishlistItemCount} wishlist`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium text-gray-500">{label}</p>
                  <p className="mt-1 text-lg font-black text-gray-900">{value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h4 className="text-lg font-black text-gray-900">Saved addresses</h4>
              {customer.addresses.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No saved addresses.</p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {customer.addresses.map((address) => (
                    <div key={address.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-black text-gray-900">{address.label}</p>
                        {address.isDefault && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">DEFAULT</span>}
                      </div>
                      <p className="mt-2 font-semibold text-gray-700">{address.fullName}</p>
                      <p className="mt-1 text-gray-500">{address.address}</p>
                      <p className="text-gray-500">{address.city}, {address.region}{address.postalCode ? ` ${address.postalCode}` : ''}</p>
                      <p className="mt-1 text-xs text-gray-400">{address.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-5">
                <h4 className="text-lg font-black text-gray-900">Order history</h4>
                <p className="text-xs text-gray-500">Latest 50 registered-account orders.</p>
              </div>
              {customer.orders.length === 0 ? (
                <p className="p-10 text-center text-sm text-gray-500">No linked orders.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[720px] w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-bold">Order</th>
                        <th className="px-4 py-3 font-bold">Total</th>
                        <th className="px-4 py-3 font-bold">Promo</th>
                        <th className="px-4 py-3 font-bold">Payment</th>
                        <th className="px-4 py-3 font-bold">Status</th>
                        <th className="px-4 py-3 font-bold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {customer.orders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">#{order.id.slice(-8).toUpperCase()}</td>
                          <td className="px-4 py-3 font-bold text-gray-900">{currencyFormatter.format(order.total)}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{order.promoCode?.code || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${statusClass(order.paymentStatus)}`}>{order.paymentStatus}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${statusClass(order.status)}`}>{getOrderStatusLabel(order.status)}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{formatDate(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <p className="pb-4 text-center text-xs text-gray-400">Customer deletion is disabled to preserve financial and order history.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CustomerTableSkeleton() {
  return (
    <div className="space-y-3 p-5 animate-pulse" aria-label="Loading customers">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-16 rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}
