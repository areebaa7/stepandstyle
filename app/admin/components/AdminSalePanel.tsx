'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminEmptyState, AdminLoadingState, AdminNotice } from './AdminAsyncState';

interface Collection {
  id: string;
  name: string;
}

interface SaleEvent {
  id: string;
  name: string;
  bannerText: string;
  discountPercent: number;
  targetCollections: string[];
  targetProducts: string[];
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
}

export default function AdminSalePanel() {
  const [sales, setSales] = useState<SaleEvent[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });

  const [form, setForm] = useState({
    name: '',
    bannerText: '',
    discountPercent: 0,
    targetCollections: [] as string[],
    targetProducts: [] as string[],
    isActive: false,
    sendPromoEmail: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [salesRes, collsRes, productsRes] = await Promise.all([
        fetch('/api/admin/sales'),
        fetch('/api/collections'),
        fetch('/api/products')
      ]);
      const salesData = await salesRes.json();
      const collsData = await collsRes.json();
      const productsData = await productsRes.json();

      if (!salesRes.ok) throw new Error(salesData.error || 'Failed to load sale events.');
      if (!collsRes.ok) throw new Error(collsData.error || 'Failed to load collections.');
      if (!productsRes.ok) throw new Error(productsData.error || 'Failed to load products.');

      setSales(salesData.sales || []);
      setCollections(collsData.collections || []);
      setProducts(productsData.data || []);
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to load sale data.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial server synchronization for this admin panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const handleCollectionToggle = (id: string) => {
    setForm(prev => ({
      ...prev,
      targetCollections: prev.targetCollections.includes(id)
        ? prev.targetCollections.filter(c => c !== id)
        : [...prev.targetCollections, id]
    }));
  };

  const handleProductToggle = (id: string) => {
    setForm(prev => ({
      ...prev,
      targetProducts: prev.targetProducts.includes(id)
        ? prev.targetProducts.filter(p => p !== id)
        : [...prev.targetProducts, id]
    }));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const res = await fetch(editingId ? `/api/admin/sales/${editingId}` : '/api/admin/sales', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus({ type: 'success', message: editingId ? 'Sale event updated!' : 'Sale event created and applied!' });
        setForm({ name: '', bannerText: '', discountPercent: 0, targetCollections: [], targetProducts: [], isActive: false, sendPromoEmail: false });
        setEditingId(null);
        setProductSearch('');
        fetchData();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save sale event');
      }
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save sale event.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSale = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/sales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setSales(prev => prev.map(s => s.id === id ? { ...s, isActive: !currentStatus } : s));
        setStatus({ type: 'success', message: currentStatus ? 'Sale event deactivated.' : 'Sale event activated!' });
      } else {
        const data = await res.json();
        setStatus({ type: 'error', message: data.error || 'Failed to update sale event.' });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Failed to update sale event.' });
    } finally {
      setTogglingId(null);
    }
  };

  const deleteSale = async (id: string) => {
    if (!confirm('Are you sure? This will also reset discounts for this sale.')) return;
    try {
      const res = await fetch(`/api/admin/sales/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const startEdit = (sale: SaleEvent) => {
    setEditingId(sale.id);
    setForm({
      name: sale.name,
      bannerText: sale.bannerText,
      discountPercent: sale.discountPercent,
      targetCollections: sale.targetCollections || [],
      targetProducts: sale.targetProducts || [],
      isActive: sale.isActive,
      sendPromoEmail: false,
    });
    setStatus({ type: 'idle', message: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', bannerText: '', discountPercent: 0, targetCollections: [], targetProducts: [], isActive: false, sendPromoEmail: false });
    setStatus({ type: 'idle', message: '' });
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {editingId ? 'Edit Sale Event' : 'Create New Sale Event'}
        </h3>
        {editingId && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <span className="text-sm font-bold text-amber-800">Editing: {form.name || 'Sale event'}</span>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs font-black uppercase tracking-widest text-amber-700 hover:text-amber-900"
            >
              Cancel Edit
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Event Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Summer Sale"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Announce Banner Text</label>
              <input
                type="text"
                required
                value={form.bannerText}
                onChange={(e) => setForm({ ...form, bannerText: e.target.value })}
                placeholder="e.g. FLASH SALE: 50% OFF"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Discount %</label>
              <input
                type="number"
                required
                min="0"
                max="100"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: parseInt(e.target.value) || 0 })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Category Selection */}
            <div className="space-y-4">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500">Target Categories</label>
              <div className="flex flex-wrap gap-2">
                {collections.map((coll) => (
                  <button
                    key={coll.id}
                    type="button"
                    onClick={() => handleCollectionToggle(coll.id)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                      form.targetCollections.includes(coll.id)
                        ? 'bg-[#6B21A8] border-[#6B21A8] text-white shadow-lg'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-purple-200 hover:text-purple-600'
                    }`}
                  >
                    {coll.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Selection */}
            <div className="space-y-4">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500">Target Individual Products</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all pr-10"
                />
                <svg className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Selected Products Preview */}
              {form.targetProducts.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
                  {form.targetProducts.map(id => {
                    const p = products.find(prod => prod.id === id);
                    return (
                      <div key={id} className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-purple-700 border border-purple-200 flex items-center gap-1">
                        {p?.name || id}
                        <button type="button" onClick={() => handleProductToggle(id)} className="text-red-400 hover:text-red-600">×</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Product Search Results */}
              {productSearch && (
                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl bg-white shadow-inner divide-y divide-gray-50">
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleProductToggle(p.id)}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between group ${
                        form.targetProducts.includes(p.id) ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">{p.name}</span>
                      {form.targetProducts.includes(p.id) ? (
                         <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                      ) : (
                         <span className="opacity-0 group-hover:opacity-100 text-purple-600 font-bold">+</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-5 h-5 text-purple-600 rounded border-2 border-slate-300"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Activate & Apply Immediately</label>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sendPromoEmail"
                checked={form.sendPromoEmail}
                onChange={(e) => setForm({ ...form, sendPromoEmail: e.target.checked })}
                className="w-5 h-5 text-pink-600 rounded border-2 border-slate-300"
              />
              <label htmlFor="sendPromoEmail" className="text-sm font-bold text-gray-700">Send Promo Email</label>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : editingId ? 'Update Sale Event' : 'Create & Apply Sale Event'}
          </button>
        </form>

        {status.message && (
          <div className="mt-4">
            <AdminNotice type={status.type === 'idle' ? 'info' : status.type} message={status.message} />
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Existing Events</h3>
        {isLoading ? (
          <AdminLoadingState label="Loading sale events..." />
        ) : sales.length === 0 ? (
          <AdminEmptyState
            title="No sale events created yet"
            description="Complete the form to schedule the first store campaign."
            compact
          />
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <div>
                  <h4 className="font-bold text-gray-900">{sale.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{sale.bannerText}</p>
                  <p className="text-xs text-purple-700 font-bold mt-1">{sale.discountPercent}% off</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleSale(sale.id, sale.isActive)}
                    disabled={togglingId !== null}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      sale.isActive ? 'bg-green-600' : 'bg-gray-300'
                    } disabled:opacity-60 disabled:cursor-wait`}
                    aria-pressed={sale.isActive}
                    aria-label={sale.isActive ? 'Deactivate sale' : 'Activate sale'}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                        sale.isActive ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                    <span className={`absolute text-[9px] font-black uppercase tracking-wider ${sale.isActive ? 'left-1.5 text-white' : 'right-1.5 text-gray-600'}`}>
                      {togglingId === sale.id ? '...' : sale.isActive ? 'On' : 'Off'}
                    </span>
                  </button>
                  <button
                    onClick={() => startEdit(sale)}
                    className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSale(sale.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
