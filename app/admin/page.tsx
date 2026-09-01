'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import PromoUsersManagement from './components/PromoUsersManagement';
import AdminOrdersPanel from './components/AdminOrdersPanel';
import AdminAnalyticsPanel from './components/AdminAnalyticsPanel';
import AffiliateApplicationsPanel from './components/AffiliateApplicationsPanel';
import AdminProductsPanel from './components/AdminProductsPanel';
import AdminCollectionsPanel from './components/AdminCollectionsPanel';
import AdminShippingPanel from './components/AdminShippingPanel';
import AdminSalePanel from './components/AdminSalePanel';
import AdminBannerPanel from './components/AdminBannerPanel';
import AdminReviewsPanel from './components/AdminReviewsPanel';
import AdminMarketingPanel from './components/AdminMarketingPanel';
import AdminReelsPanel from './components/AdminReelsPanel';
import AdminConversionPanel from './components/AdminConversionPanel';
import AdminHomepageBuilderPanel from './components/AdminHomepageBuilderPanel';
import AdminNewsletterPanel from './components/AdminNewsletterPanel';
import AdminSystemStatusPanel from './components/AdminSystemStatusPanel';
import AdminCustomersPanel from './components/AdminCustomersPanel';
import AdminInventoryPanel from './components/AdminInventoryPanel';
import AdminBusinessSettingsPanel from './components/AdminBusinessSettingsPanel';
import AdminPoliciesPanel from './components/AdminPoliciesPanel';
import AdminAffiliateRulesPanel from './components/AdminAffiliateRulesPanel';
import AdminCartRecoveryPanel from './components/AdminCartRecoveryPanel';
import AdminSplashScreenPanel from './components/AdminSplashScreenPanel';
import AdminAIAnalysisPanel from './components/AdminAIAnalysisPanel';
import AdminAISEOPanel from './components/AdminAISEOPanel';
import AdminLeadGeneratorPanel from './components/AdminLeadGeneratorPanel';
import { AdminNotice } from './components/AdminAsyncState';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const tabsNavRef = useRef<HTMLElement>(null);

  const handleVideoPlay = () => {
    if (audioRef.current && videoRef.current) {
      audioRef.current.currentTime = videoRef.current.currentTime;
      audioRef.current.play().catch(e => console.warn('Audio play blocked:', e));
    }
  };

  const handleVideoPause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleVideoSeeked = () => {
    if (audioRef.current && videoRef.current) {
      audioRef.current.currentTime = videoRef.current.currentTime;
    }
  };

  const handleVideoVolumeChange = () => {
    if (audioRef.current && videoRef.current) {
      audioRef.current.volume = videoRef.current.volume;
      audioRef.current.muted = videoRef.current.muted;
    }
  };
  const [productsCount, setProductsCount] = useState(0);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [overviewStats, setOverviewStats] = useState({
    totalOrders: 0,
    approvedPayments: 0,
    totalRevenue: 0,
    pendingDelivery: 0,
    uniqueCustomers: 0,
  });
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setIsLoggingOut(false);
      window.location.href = '/';
    }
  };

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setIsOverviewLoading(true);
        setOverviewError('');
        const response = await fetch('/api/orders?scope=all', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.data) {
          throw new Error(data.error || 'Failed to load orders');
        }
        const orders = data.data as Array<{
          id: string;
          total: string | number;
          paymentStatus: string;
          status: string;
          shippingEmail: string;
        }>;
        const totalOrders = orders.length;
        const approvedPayments = orders.filter((order) => order.paymentStatus === 'APPROVED').length;
        const totalRevenue = orders
          .filter((order) => order.status === 'COMPLETED')
          .reduce((sum, order) => sum + Number(order.total ?? 0), 0);
        const pendingDelivery = orders.filter(
          (order) => order.status === 'PENDING' || order.status === 'SHIPPED',
        ).length;
        const uniqueCustomers = new Set(orders.map((order) => order.shippingEmail)).size;

        setOverviewStats({
          totalOrders,
          approvedPayments,
          totalRevenue,
          pendingDelivery,
          uniqueCustomers,
        });
      } catch (error) {
        console.warn('Failed to load overview stats', error);
        setOverviewError(error instanceof Error ? error.message : 'Failed to load dashboard overview.');
      } finally {
        setIsOverviewLoading(false);
      }
    };

    loadOverview();
  }, []);

  useEffect(() => {
    const fetchProductCount = async () => {
      try {
        const response = await fetch('/api/products', { cache: 'no-store' });
        const data = await response.json();
        if (response.ok) {
          setProductsCount(data.count ?? data.data?.length ?? 0);
          setAllProducts(Array.isArray(data.data) ? data.data : []);
        }
      } catch (error) {
        console.warn('Failed to load product count', error);
        setOverviewError((current) => current || (error instanceof Error ? error.message : 'Failed to load product count.'));
      }
    };

    fetchProductCount();
  }, []);

  useEffect(() => {
    const tabsNav = tabsNavRef.current;
    if (!tabsNav) return;

    const handleTabsWheel = (event: WheelEvent) => {
      if (tabsNav.scrollWidth <= tabsNav.clientWidth) return;

      event.preventDefault();
      const scrollAmount =
        Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      tabsNav.scrollLeft += scrollAmount;
    };

    tabsNav.addEventListener('wheel', handleTabsWheel, { passive: false });
    return () => tabsNav.removeEventListener('wheel', handleTabsWheel);
  }, []);

  useEffect(() => {
    const tabsNav = tabsNavRef.current;
    const activeTabButton = tabsNav?.querySelector<HTMLElement>(
      `[data-admin-tab="${activeTab}"]`,
    );
    if (!tabsNav || !activeTabButton) return;

    const centeredLeft =
      activeTabButton.offsetLeft - (tabsNav.clientWidth - activeTabButton.offsetWidth) / 2;
    tabsNav.scrollTo({ left: Math.max(0, centeredLeft), behavior: 'smooth' });
  }, [activeTab]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(value);

  const bestSellers = [...allProducts]
    .sort((a, b) => Number(b.saleCount || 0) - Number(a.saleCount || 0))
    .slice(0, 5);
  const topSeller = bestSellers[0];
  const inStockProducts = allProducts.filter((product) => product.inStock).length;
  const outOfStockProducts = allProducts.length - inStockProducts;
  const onSaleProducts = allProducts.filter(
    (product) => Number(product.discount || 0) > 0 || (product.salePrice && product.salePrice > product.price),
  ).length;
  const lowStockProducts = allProducts.filter(
    (product) =>
      Array.isArray(product.variants) &&
      product.variants.some((variant: any) => Number(variant.stock) > 0 && Number(variant.stock) <= 5),
  );
  const totalStockUnits = allProducts.reduce((sum, product) => {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    return sum + variants.reduce((variantSum: number, variant: any) => variantSum + Number(variant.stock || 0), 0);
  }, 0);
  const averagePrice = allProducts.length
    ? allProducts.reduce((sum, product) => sum + Number(product.price || 0), 0) / allProducts.length
    : 0;
  const maxPrice = allProducts.length
    ? Math.max(...allProducts.map((product) => Number(product.price || 0)))
    : 0;
  const minPrice = allProducts.length
    ? Math.min(...allProducts.map((product) => Number(product.price || 0)))
    : 0;
  const topRated = [...allProducts].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 5);
  const collectionStats = Object.values(
    allProducts.reduce((groups: Record<string, { name: string; count: number; stockUnits: number }>, product) => {
      const name = product.collection?.name ?? 'Uncategorized';
      if (!groups[name]) groups[name] = { name, count: 0, stockUnits: 0 };
      groups[name].count += 1;
      const variants = Array.isArray(product.variants) ? product.variants : [];
      groups[name].stockUnits += variants.reduce((variantSum: number, variant: any) => variantSum + Number(variant.stock || 0), 0);
      return groups;
    }, {}),
  ).sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-[#A855F7] shadow-lg shadow-purple-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-0">
          <div className="flex flex-col md:flex-row justify-between items-center h-auto md:h-16 gap-3 md:gap-0">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide text-white/90 text-center md:text-left">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsTutorialOpen(true)}
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-white/10 border border-white/20 text-xs md:text-sm font-semibold text-white hover:bg-white hover:text-[#A855F7] transition flex-1 md:flex-none"
              >
                Tutorial
              </button>
              <Link
                href="/?preview=true"
                className="text-white/80 hover:text-white font-medium transition-colors text-xs md:text-sm whitespace-nowrap px-2"
              >
                ⬅ Back to Store
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-white/20 text-xs md:text-sm font-semibold text-white hover:bg-white/10 transition disabled:opacity-60 flex-1 md:flex-none"
              >
                {isLoggingOut ? '...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-gray-50/80 p-2 shadow-sm">
          <nav
            ref={tabsNavRef}
            aria-label="Admin dashboard sections"
            className="flex gap-2 overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'ai-analysis', label: 'AI Product Analysis' },
              { id: 'ai-seo', label: '🔍 AI Weekly SEO' },
              { id: 'lead-generator', label: '📣 Social Lead Engine' },
              { id: 'splash', label: 'Splash Screen' },
              { id: 'products', label: 'Products' },
              { id: 'inventory', label: 'Inventory' },
              { id: 'collections', label: 'Collections' }, { id: 'shipping', label: 'Shipping' }, { id: 'orders', label: 'Orders' },
              { id: 'customers', label: 'Customers' },
              { id: 'promo-users', label: 'Promo Users' },
              { id: 'affiliate-applications', label: 'Affiliate Applications' },
              { id: 'affiliate-rules', label: 'Affiliate Rules' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'marketing', label: 'Conversion Tracking' },
              { id: 'newsletter', label: 'Email Marketing' },
              { id: 'cart-recovery', label: 'Cart Recovery' },
              { id: 'system-status', label: 'Email & Cron Status' },
              { id: 'conversion', label: 'Conversion Settings' },
              { id: 'business-info', label: 'Business Info' },
              { id: 'policies', label: 'Policies' },
              { id: 'homepage-builder', label: 'Homepage Builder' },
              { id: 'sales', label: 'Sale Events' },
              { id: 'reviews', label: 'Reviews' },
              { id: 'appearance', label: 'Appearance' },
              { id: 'reels', label: 'Reels' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-admin-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                  ? 'border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 hover:shadow-sm'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[65vh] overflow-x-hidden bg-white rounded-lg shadow-sm p-6">
          <div key={activeTab} className="admin-tab-panel">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
              {overviewError && (
                <div className="mb-6">
                  <AdminNotice type="error" message={overviewError} />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
                  <p className="text-gray-600 text-sm mb-2">Total Products</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {productsCount}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
                  <p className="text-gray-600 text-sm mb-2">Total Orders</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {isOverviewLoading ? '…' : overviewStats.totalOrders}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
                  <p className="text-gray-600 text-sm mb-2">Approved Payments</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {isOverviewLoading ? '…' : overviewStats.approvedPayments}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-100">
                  <p className="text-gray-600 text-sm mb-2">Pending Deliveries</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {isOverviewLoading ? '…' : overviewStats.pendingDelivery}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <p className="text-gray-600 text-sm mb-2">Total Revenue (delivered)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isOverviewLoading ? '…' : formatCurrency(overviewStats.totalRevenue)}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <p className="text-gray-600 text-sm mb-2">Unique Customers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isOverviewLoading ? '…' : overviewStats.uniqueCustomers}
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('products')}
                    className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                  >
                    View Products
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                  >
                    View Orders
                  </button>
                  <button
                    onClick={() => setActiveTab('promo-users')}
                    className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                  >
                    Manage Promo Users
                  </button>
                  <button
                    onClick={() => setActiveTab('customers')}
                    className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                  >
                    Manage Customers
                  </button>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                  >
                    Check Inventory
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('blogs')}
                    className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                  >
                    Manage Blogs
                  </button>
                  <button
                    onClick={() => setActiveTab('appearance')}
                    className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                  >
                    Edit Banners
                  </button>
                  <button
                    onClick={() => setActiveTab('reels')}
                    className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                  >
                    Manage Videos
                  </button>
                  <button
                    onClick={() => setActiveTab('conversion')}
                    className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                  >
                    Conversion Settings
                  </button>
                  <button
                    onClick={() => setActiveTab('homepage-builder')}
                    className="bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                  >
                    Build Homepage
                  </button>
                </div>
              </div>

              {/* Best Selling Product */}
              <div className="mt-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Best Selling Products</h3>
                {topSeller ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600 mb-3">#1 Best Seller</p>
                      <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-white shadow-md mb-4 bg-white">
                        <img src={topSeller.image || '/logo_main.png'} alt={topSeller.name} className="w-full h-full object-cover" />
                      </div>
                      <h4 className="font-bold text-gray-900 leading-snug">{topSeller.name}</h4>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                        <span><span className="font-bold text-purple-700">{topSeller.saleCount}</span> units sold</span>
                        <span><span className="font-bold text-gray-900">{formatCurrency(Number(topSeller.saleCount || 0) * Number(topSeller.price || 0))}</span> revenue</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-semibold text-gray-700">{Number(topSeller.rating || 0).toFixed(1)} rating</span>
                      </div>
                    </div>
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">
                      {bestSellers.map((product, index) => (
                        <div key={product.id} className="flex items-center gap-4 p-4">
                          <span className="w-6 text-center font-black text-gray-400">{index + 1}</span>
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                            <img src={product.image || '/logo_main.png'} alt={product.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{product.title}</p>
                            <p className="text-xs text-gray-500 truncate">{product.collection?.name ?? 'Uncategorized'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(product.price || 0))}</p>
                            <p className="text-xs text-gray-500">{product.saleCount} sold</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
                    No product data available yet.
                  </div>
                )}
              </div>

              {/* Product Analysis of All Inventory */}
              <div className="mt-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Product Analysis (All Inventory)</h3>
                {allProducts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
                    No products to analyze.
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">Total Products</p>
                        <p className="text-2xl font-bold text-gray-900">{allProducts.length}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">In Stock</p>
                        <p className="text-2xl font-bold text-green-600">{inStockProducts}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">Out of Stock</p>
                        <p className="text-2xl font-bold text-rose-600">{outOfStockProducts}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">On Sale</p>
                        <p className="text-2xl font-bold text-purple-700">{onSaleProducts}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">Total Stock Units</p>
                        <p className="text-2xl font-bold text-gray-900">{totalStockUnits}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">Price Range</p>
                        <p className="text-2xl font-bold text-gray-900 truncate">{formatCurrency(minPrice)} - {formatCurrency(maxPrice)}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">Average Price</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(averagePrice)}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <p className="text-gray-500 text-xs mb-1">Low Stock Items</p>
                        <p className="text-2xl font-bold text-amber-600">{lowStockProducts.length}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 shadow-sm">
                        <h4 className="font-bold text-amber-900 mb-3">Low Stock Alerts (5 or fewer units)</h4>
                        {lowStockProducts.length === 0 ? (
                          <p className="text-sm text-amber-800">All products have healthy stock levels. Nothing to restock right now.</p>
                        ) : (
                          <ul className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
                            {lowStockProducts.slice(0, 10).map((product) => (
                              <li key={product.id} className="flex items-start justify-between gap-3 text-sm">
                                <span className="font-semibold text-amber-900 leading-snug min-w-0">{product.title}</span>
                                <span className="shrink-0 flex flex-wrap gap-1 justify-end">
                                  {Array.isArray(product.variants)
                                    ? product.variants
                                        .filter((variant: any) => Number(variant.stock) > 0 && Number(variant.stock) <= 5)
                                        .map((variant: any) => (
                                          <span key={`${variant.color || ''}${variant.size || ''}`} className="rounded-full bg-amber-200/70 px-2 py-0.5 text-xs font-bold text-amber-800 whitespace-nowrap">
                                            {variant.color || variant.size || 'Default'}: {variant.stock}
                                          </span>
                                        ))
                                    : null}
                                </span>
                              </li>
                            ))}
                            {lowStockProducts.length > 10 && (
                              <li className="text-xs font-semibold text-amber-700">
                                +{lowStockProducts.length - 10} more low stock items
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-3">Top Rated Products</h4>
                        <ul className="space-y-3">
                          {topRated.map((product, index) => (
                            <li key={product.id} className="flex items-center gap-3 text-sm">
                              <span className="w-5 text-center font-black text-gray-400">{index + 1}</span>
                              <span className="flex-1 font-semibold text-gray-800 truncate">{product.title}</span>
                              <span className="text-yellow-500">★ {Number(product.rating || 0).toFixed(1)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <h4 className="font-bold text-gray-900 px-6 py-4 border-b border-gray-100">Inventory by Collection</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left text-gray-500">
                            <th className="px-6 py-3 font-semibold">Collection</th>
                            <th className="px-6 py-3 font-semibold text-right">Products</th>
                            <th className="px-6 py-3 font-semibold text-right">Stock Units</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {collectionStats.map((collection) => (
                            <tr key={collection.name}>
                              <td className="px-6 py-3 font-semibold text-gray-900">{collection.name}</td>
                              <td className="px-6 py-3 text-right text-gray-700">{collection.count}</td>
                              <td className="px-6 py-3 text-right text-gray-700">{collection.stockUnits}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ai-analysis' && <AdminAIAnalysisPanel />}
          {activeTab === 'ai-seo' && <AdminAISEOPanel />}
          {activeTab === 'lead-generator' && <AdminLeadGeneratorPanel />}

          {activeTab === 'products' && (
            <AdminProductsPanel onProductsCountChange={setProductsCount} />
          )}

          {activeTab === 'splash' && <AdminSplashScreenPanel />}

          {activeTab === 'inventory' && <AdminInventoryPanel />}

          {activeTab === 'collections' && (
            <AdminCollectionsPanel />
          )}

          {activeTab === 'shipping' && (
            <AdminShippingPanel />
          )}

          {activeTab === 'orders' && <AdminOrdersPanel />}

          {activeTab === 'customers' && <AdminCustomersPanel />}

          {activeTab === 'promo-users' && (
            <PromoUsersManagement />
          )}

          {activeTab === 'affiliate-applications' && (
            <AffiliateApplicationsPanel />
          )}

          {activeTab === 'affiliate-rules' && <AdminAffiliateRulesPanel />}

          { activeTab === 'analytics' && <AdminAnalyticsPanel /> }

          { activeTab === 'marketing' && <AdminMarketingPanel /> }

          { activeTab === 'newsletter' && <AdminNewsletterPanel /> }

          { activeTab === 'cart-recovery' && <AdminCartRecoveryPanel /> }

          { activeTab === 'system-status' && <AdminSystemStatusPanel /> }

          { activeTab === 'sales' && <AdminSalePanel /> }

          { activeTab === 'reviews' && <AdminReviewsPanel /> }

          { activeTab === 'appearance' && <AdminBannerPanel /> }

          { activeTab === 'reels' && <AdminReelsPanel /> }

          { activeTab === 'conversion' && <AdminConversionPanel /> }

          { activeTab === 'business-info' && <AdminBusinessSettingsPanel /> }

          { activeTab === 'policies' && <AdminPoliciesPanel /> }

          { activeTab === 'homepage-builder' && <AdminHomepageBuilderPanel /> }
          </div>
        </div>

      </div>

      {/* Tutorial Video Modal */}
      {isTutorialOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl overflow-hidden max-w-5xl w-full shadow-2xl relative">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Admin Dashboard Tutorial</h3>
              <button onClick={() => setIsTutorialOpen(false)} className="text-gray-500 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="aspect-video bg-black w-full relative">
              <video
                ref={videoRef}
                src="/Tutorial/video1699022999.mp4"
                controls
                muted
                autoPlay
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onSeeked={handleVideoSeeked}
                onVolumeChange={handleVideoVolumeChange}
                className="w-full h-full object-contain"
              />
              <audio
                ref={audioRef}
                src="/Tutorial/audio1699022999.m4a"
                muted
                autoPlay
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
