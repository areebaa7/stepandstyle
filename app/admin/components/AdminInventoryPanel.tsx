'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminEmptyState, AdminErrorState, AdminNotice } from './AdminAsyncState';
import AdminPagination from './AdminPagination';

const INVENTORY_PAGE_SIZE = 10;

type InventoryStatus = 'ALL' | 'LOW' | 'OUT' | 'HEALTHY' | 'NO_VARIANTS';

interface InventoryVariant {
  key: string;
  id: string | null;
  color: string;
  size: string;
  stock: number;
}

interface InventoryProduct {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  collectionName: string | null;
  inStock: boolean;
  status: Exclude<InventoryStatus, 'ALL'>;
  totalUnits: number;
  variantCount: number;
  lowStockVariants: number;
  outOfStockVariants: number;
  availabilityMismatch: boolean;
  variants: InventoryVariant[];
  updatedAt: string;
}

interface InventorySummary {
  totalProducts: number;
  totalUnits: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  lowStockVariants: number;
  outOfStockVariants: number;
  availabilityMismatches: number;
  productsWithoutVariants: number;
}

const emptySummary: InventorySummary = {
  totalProducts: 0,
  totalUnits: 0,
  lowStockProducts: 0,
  outOfStockProducts: 0,
  lowStockVariants: 0,
  outOfStockVariants: 0,
  availabilityMismatches: 0,
  productsWithoutVariants: 0,
};

const numberFormatter = new Intl.NumberFormat('en-PK');

function statusStyle(status: InventoryProduct['status']) {
  if (status === 'OUT') return 'bg-rose-50 text-rose-700 ring-rose-200';
  if (status === 'LOW') return 'bg-amber-50 text-amber-700 ring-amber-200';
  if (status === 'HEALTHY') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  return 'bg-blue-50 text-blue-700 ring-blue-200';
}

function statusLabel(status: InventoryProduct['status']) {
  if (status === 'OUT') return 'OUT OF STOCK';
  if (status === 'LOW') return 'LOW STOCK';
  if (status === 'HEALTHY') return 'HEALTHY';
  return 'AVAILABILITY ONLY';
}

function editKey(productId: string, variantKey: string) {
  return `${productId}::${variantKey}`;
}

export default function AdminInventoryPanel() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [summary, setSummary] = useState<InventorySummary>(emptySummary);
  const [threshold, setThreshold] = useState(5);
  const [status, setStatus] = useState<InventoryStatus>('ALL');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(products.length / INVENTORY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = useMemo(
    () => products.slice((currentPage - 1) * INVENTORY_PAGE_SIZE, currentPage * INVENTORY_PAGE_SIZE),
    [currentPage, products],
  );

  const loadInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = new URLSearchParams({ threshold: String(threshold), status });
      if (search) params.set('search', search);
      const response = await fetch(`/api/admin/inventory?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load inventory.');
      }
      setProducts(payload.data || []);
      setSummary(payload.summary || emptySummary);
      const nextDrafts: Record<string, string> = {};
      for (const product of payload.data || []) {
        for (const variant of product.variants || []) {
          nextDrafts[editKey(product.id, variant.key)] = String(variant.stock);
        }
      }
      setStockDrafts(nextDrafts);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load inventory.');
    } finally {
      setIsLoading(false);
    }
  }, [search, status, threshold]);

  useEffect(() => {
    // Inventory is intentionally synchronized with the alert filters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInventory();
  }, [loadInventory]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(searchDraft.trim());
    setPage(1);
  };

  const updateVariantStock = async (product: InventoryProduct, variant: InventoryVariant) => {
    const key = editKey(product.id, variant.key);
    const stock = Number(stockDrafts[key]);
    if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) {
      setNotice({ type: 'error', message: 'Stock must be a whole number between 0 and 1,000,000.' });
      return;
    }

    try {
      setSavingKey(key);
      setNotice(null);
      const response = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_VARIANT_STOCK',
          productId: product.id,
          variantKey: variant.key,
          stock,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to update stock.');
      }
      setNotice({ type: 'success', message: `${product.title} · ${variant.color} / ${variant.size} updated to ${stock}.` });
      await loadInventory();
    } catch (saveError) {
      setNotice({ type: 'error', message: saveError instanceof Error ? saveError.message : 'Failed to update stock.' });
    } finally {
      setSavingKey(null);
    }
  };

  const setProductAvailability = async (product: InventoryProduct, inStock: boolean) => {
    const key = `availability:${product.id}`;
    try {
      setSavingKey(key);
      setNotice(null);
      const response = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SET_AVAILABILITY', productId: product.id, inStock }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to update availability.');
      }
      setNotice({ type: 'success', message: `${product.title} is now ${inStock ? 'available' : 'unavailable'}.` });
      await loadInventory();
    } catch (saveError) {
      setNotice({ type: 'error', message: saveError instanceof Error ? saveError.message : 'Failed to update availability.' });
    } finally {
      setSavingKey(null);
    }
  };

  const attentionCount = summary.lowStockProducts + summary.outOfStockProducts;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-600">Stock control</p>
          <h2 className="mt-1 text-2xl font-black text-gray-900">Inventory & Low-Stock Alerts</h2>
          <p className="text-sm text-gray-500">Monitor every product variant and update quantities without opening the product editor.</p>
        </div>
        <button type="button" onClick={() => void loadInventory()} disabled={isLoading} className="self-start rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-100 disabled:opacity-60 sm:self-auto">
          {isLoading ? 'Refreshing…' : 'Refresh inventory'}
        </button>
      </div>

      {attentionCount > 0 || summary.availabilityMismatches > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-black">Inventory attention required</p>
          <p className="mt-1 text-amber-800">
            {summary.outOfStockProducts} out-of-stock and {summary.lowStockProducts} low-stock products.
            {summary.availabilityMismatches > 0 ? ` ${summary.availabilityMismatches} availability flags do not match variant quantities.` : ''}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Inventory is healthy at the selected low-stock threshold.
        </div>
      )}

      {notice && (
        <AdminNotice type={notice.type} message={notice.message} />
      )}

      <InventorySummaryCards summary={summary} activeStatus={status} onStatusChange={(nextStatus) => { setStatus(nextStatus); setPage(1); }} />

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-gray-100 p-4 lg:grid-cols-[1fr_auto_auto] lg:p-5">
          <form onSubmit={submitSearch} className="flex min-w-0 gap-2">
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search product, slug or collection"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
            <button type="submit" className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700">Search</button>
          </form>
          <select value={status} onChange={(event) => { setStatus(event.target.value as InventoryStatus); setPage(1); }} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-purple-500" aria-label="Inventory status filter">
            <option value="ALL">All inventory states</option>
            <option value="LOW">Low stock</option>
            <option value="OUT">Out of stock</option>
            <option value="HEALTHY">Healthy</option>
            <option value="NO_VARIANTS">Availability only</option>
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700">
            Low-stock at
            <select value={threshold} onChange={(event) => { setThreshold(Number(event.target.value)); setPage(1); }} className="bg-transparent font-black text-purple-700 outline-none" aria-label="Low stock threshold">
              <option value={3}>3 units</option>
              <option value={5}>5 units</option>
              <option value={10}>10 units</option>
              <option value={20}>20 units</option>
            </select>
          </label>
        </div>

        {error ? (
          <div className="p-5">
            <AdminErrorState message={error} onRetry={() => void loadInventory()} />
          </div>
        ) : isLoading ? (
          <InventorySkeleton />
        ) : products.length === 0 ? (
          <div className="p-5">
            <AdminEmptyState
              title="No inventory matches these filters"
              description="Change the status, search, or low-stock threshold."
              compact
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {paginatedProducts.map((product) => {
              const expanded = expandedProduct === product.id;
              return (
                <article key={product.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                        <Image src={product.image || '/logo_main.png'} alt={product.title} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-black text-gray-900">{product.title}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ring-inset ${statusStyle(product.status)}`}>{statusLabel(product.status)}</span>
                          {product.availabilityMismatch && <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-black text-red-700 ring-1 ring-inset ring-red-200">FLAG MISMATCH</span>}
                        </div>
                        <p className="mt-1 truncate text-xs text-gray-500">{product.collectionName || 'No collection'} · /{product.slug}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
                      <Metric label="Units" value={product.variantCount ? numberFormatter.format(product.totalUnits) : 'N/A'} />
                      <Metric label="Low variants" value={numberFormatter.format(product.lowStockVariants)} tone={product.lowStockVariants ? 'warning' : undefined} />
                      <Metric label="Out variants" value={numberFormatter.format(product.outOfStockVariants)} tone={product.outOfStockVariants ? 'danger' : undefined} />
                    </div>

                    {product.variantCount > 0 ? (
                      <button type="button" onClick={() => setExpandedProduct(expanded ? null : product.id)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700">
                        {expanded ? 'Hide variants' : `Manage ${product.variantCount} variants`}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={savingKey === `availability:${product.id}`}
                        onClick={() => void setProductAvailability(product, !product.inStock)}
                        className={`rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${product.inStock ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                      >
                        {savingKey === `availability:${product.id}` ? 'Saving…' : product.inStock ? 'Mark unavailable' : 'Mark available'}
                      </button>
                    )}
                  </div>

                  {expanded && product.variantCount > 0 && (
                    <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200">
                      <table className="min-w-[620px] w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="px-4 py-3 font-bold">Color</th>
                            <th className="px-4 py-3 font-bold">Size</th>
                            <th className="px-4 py-3 font-bold">Current state</th>
                            <th className="px-4 py-3 font-bold">Stock quantity</th>
                            <th className="px-4 py-3 text-right font-bold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {product.variants.map((variant) => {
                            const key = editKey(product.id, variant.key);
                            const draft = stockDrafts[key] ?? String(variant.stock);
                            const changed = Number(draft) !== variant.stock;
                            const variantTone = variant.stock === 0 ? 'danger' : variant.stock <= threshold ? 'warning' : undefined;
                            return (
                              <tr key={variant.key}>
                                <td className="px-4 py-3 font-bold text-gray-900">{variant.color}</td>
                                <td className="px-4 py-3 text-gray-600">{variant.size}</td>
                                <td className="px-4 py-3"><StockBadge stock={variant.stock} threshold={threshold} /></td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    min="0"
                                    max="1000000"
                                    step="1"
                                    value={draft}
                                    onChange={(event) => setStockDrafts((current) => ({ ...current, [key]: event.target.value }))}
                                    className={`w-28 rounded-lg border px-3 py-2 font-bold outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 ${variantTone === 'danger' ? 'border-rose-200 bg-rose-50 text-rose-800' : variantTone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-gray-300 text-gray-900'}`}
                                    aria-label={`${product.title} ${variant.color} ${variant.size} stock`}
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    disabled={!changed || savingKey === key}
                                    onClick={() => void updateVariantStock(product, variant)}
                                    className="rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                                  >
                                    {savingKey === key ? 'Saving…' : changed ? 'Save stock' : 'Saved'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
        {!error && !isLoading && products.length > 0 && (
          <AdminPagination page={currentPage} pageSize={INVENTORY_PAGE_SIZE} totalItems={products.length} itemLabel="products" onPageChange={setPage} />
        )}
      </section>

      <p className="text-center text-xs text-gray-400">Variant stock controls storefront availability automatically. Products without variants use a manual availability switch.</p>
    </div>
  );
}

function InventorySummaryCards({
  summary,
  activeStatus,
  onStatusChange,
}: {
  summary: InventorySummary;
  activeStatus: InventoryStatus;
  onStatusChange: (status: InventoryStatus) => void;
}) {
  const cards: Array<{ label: string; value: string; filter: InventoryStatus; tone?: string; note: string }> = [
    { label: 'All products', value: numberFormatter.format(summary.totalProducts), filter: 'ALL', note: `${numberFormatter.format(summary.totalUnits)} tracked units` },
    { label: 'Low-stock products', value: numberFormatter.format(summary.lowStockProducts), filter: 'LOW', tone: 'text-amber-700', note: `${summary.lowStockVariants} low variants` },
    { label: 'Out-of-stock products', value: numberFormatter.format(summary.outOfStockProducts), filter: 'OUT', tone: 'text-rose-700', note: `${summary.outOfStockVariants} empty variants` },
    { label: 'Healthy products', value: numberFormatter.format(Math.max(0, summary.totalProducts - summary.lowStockProducts - summary.outOfStockProducts - summary.productsWithoutVariants)), filter: 'HEALTHY', tone: 'text-emerald-700', note: 'Above threshold' },
    { label: 'Availability only', value: numberFormatter.format(summary.productsWithoutVariants), filter: 'NO_VARIANTS', tone: 'text-blue-700', note: 'No variant quantities' },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <button
          type="button"
          key={card.label}
          onClick={() => onStatusChange(card.filter)}
          className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${activeStatus === card.filter ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-200'}`}
        >
          <p className="text-xs font-semibold text-gray-500">{card.label}</p>
          <p className={`mt-2 text-2xl font-black ${card.tone || 'text-gray-900'}`}>{card.value}</p>
          <p className="mt-1 text-xs text-gray-400">{card.note}</p>
        </button>
      ))}
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'warning' | 'danger' }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-black ${tone === 'danger' ? 'text-rose-700' : tone === 'warning' ? 'text-amber-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  const className = stock === 0
    ? 'bg-rose-50 text-rose-700 ring-rose-200'
    : stock <= threshold
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  const label = stock === 0 ? 'OUT' : stock <= threshold ? 'LOW' : 'HEALTHY';
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ring-inset ${className}`}>{label}</span>;
}

function InventorySkeleton() {
  return (
    <div className="space-y-3 p-5 animate-pulse" aria-label="Loading inventory">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-24 rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}
