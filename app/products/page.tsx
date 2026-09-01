'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import CollectionsCarousel from '@/app/components/CollectionsCarousel';
import ProductCard from './components/ProductCard';
import type { ProductDTO } from '@/types/product';
import type { CollectionDTO } from '@/types/product';
import SaleBanner from '@/app/components/SaleBanner';

interface FilterState {
  search: string;
  collectionId: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  inStock: boolean | null;
  gender: string;
  isNew: boolean | null;
  isTrending: boolean | null;
  onSale: boolean | null;
}

const PRODUCTS_PER_PAGE = 12;

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [collections, setCollections] = useState<CollectionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOpen, setSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    collectionId: searchParams.get('collectionId') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    inStock: searchParams.get('inStock') === 'true' ? true : null,
    gender: searchParams.get('gender') || '',
    isNew: searchParams.get('isNew') === 'true' ? true : null,
    isTrending: searchParams.get('isTrending') === 'true' ? true : null,
    onSale: searchParams.get('onSale') === 'true' ? true : null,
  });

  useEffect(() => {
    // URL query changes are an external navigation source for the local filter controls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters({
      search: searchParams.get('search') || '',
      collectionId: searchParams.get('collectionId') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      sort: searchParams.get('sort') || 'newest',
      inStock: searchParams.get('inStock') === 'true' ? true : null,
      gender: searchParams.get('gender') || '',
      isNew: searchParams.get('isNew') === 'true' ? true : null,
      isTrending: searchParams.get('isTrending') === 'true' ? true : null,
      onSale: searchParams.get('onSale') === 'true' ? true : null,
    });
  }, [searchParams]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/collections');
        const data = await response.json();
        if (data.success) {
          setCollections(data.collections);
        }
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      }
    };
    fetchCollections();
  }, []);

  const fetchProducts = async (currentFilters: FilterState) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentFilters.search) params.append('search', currentFilters.search);
      if (currentFilters.collectionId) params.append('collectionId', currentFilters.collectionId);
      if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice);
      if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice);
      if (currentFilters.sort) params.append('sort', currentFilters.sort);
      if (currentFilters.inStock !== null) params.append('inStock', currentFilters.inStock.toString());
      if (currentFilters.gender) params.append('gender', currentFilters.gender);
      if (currentFilters.isNew) params.append('isNew', 'true');
      if (currentFilters.isTrending) params.append('isTrending', 'true');
      if (currentFilters.onSale) params.append('onSale', 'true');

      const newUrl = `/products?${params.toString()}`;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(filters);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const newFilters = { ...filters, [key]: value };
    // When gender changes, clear the selected collection since it belongs to the previous gender
    if (key === 'gender') {
      newFilters.collectionId = '';
    }
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilters({
      search: '',
      collectionId: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      inStock: null,
      gender: '',
      isNew: null,
      isTrending: null,
      onSale: null,
    });
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = products.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const activeCollection = collections.find(c => c.id === filters.collectionId);
  const pageTitle = filters.onSale ? 'Sale products' : filters.gender === 'MEN' ? 'Men Collection' : filters.gender === 'WOMEN' ? 'Women Collection' : filters.gender === 'KIDS' ? 'Kids Collection' : activeCollection ? `${activeCollection.name} Collection` : 'All products';

  // Filter collections by the selected gender
  const filteredCollections = filters.gender
    ? collections.filter(c => c.targetGender === filters.gender)
    : collections;

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-asc', label: 'Price: Low → High' },
    { value: 'price-desc', label: 'Price: High → Low' },
  ];
  const activeSort = sortOptions.find(s => s.value === filters.sort);


  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-10 pt-6 md:pt-8 pb-12 md:pb-20">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-semibold  tracking-tight text-gray-900 mb-1 sm:mb-2">
            {pageTitle}
          </h1>
          <p className="text-sm text-gray-400 font-medium">
            {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Collections Carousel */}
        {filteredCollections.length > 0 && !filters.onSale && (
          <CollectionsCarousel
            collections={filteredCollections}
            selectedCollectionId={filters.collectionId}
            onCollectionSelect={(collectionId) =>
              handleChange('collectionId', filters.collectionId === collectionId ? '' : collectionId)
            }
          />
        )}

        {/* Filter Bar */}
        <div className="space-y-6 mb-10 pb-6 border-b border-gray-100">
          {/* Search & Sort Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[280px] md:max-w-[400px]">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleChange('search', e.target.value)}
                placeholder="Search products..."
                className="w-full pl-11 pr-4 py-3 text-[12px] font-medium border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none transition-all bg-gray-50/50"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 px-5 py-3 text-xs font-semibold  tracking-wide text-gray-600 border border-gray-100 rounded-xl hover:border-purple-300 hover:text-purple-600 transition-all bg-white shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                  {activeSort?.label || 'Sort'}
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 min-w-[200px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { handleChange('sort', opt.value); setSortOpen(false); }}
                        className={`w-full text-left px-5 py-4 text-xs font-semibold  tracking-wide transition-colors ${
                          filters.sort === opt.value ? 'bg-purple-50 text-purple-600' : 'text-gray-500 hover:bg-purple-50 hover:text-purple-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset Button */}
              {(filters.search || filters.collectionId || filters.gender || filters.isNew || filters.isTrending || filters.onSale) && (
                <button
                  onClick={handleReset}
                  className="p-3 text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-all bg-white shadow-sm"
                  title="Clear all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              )}
            </div>
          </div>

          {/* Quick Filters Scrollable Row */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0">
            {/* Gender Chips */}
            <div className="flex items-center gap-2 border-r border-gray-100 pr-3 mr-1">
              {['', 'WOMEN', 'MEN', 'KIDS'].map((g) => (
                <button
                  key={g}
                  onClick={() => handleChange('gender', g)}
                  className={`px-5 py-2.5 text-xs font-semibold  tracking-wide border rounded-full transition-all duration-300 whitespace-nowrap ${
                    filters.gender === g
                      ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200'
                      : 'text-gray-500 border-gray-100 hover:border-purple-300 hover:text-purple-600 bg-white'
                  }`}
                >
                  {g === '' ? 'All' : g === 'WOMEN' ? 'Women' : g === 'MEN' ? 'Men' : 'Kids'}
                </button>
              ))}
            </div>

            {/* Status Chips */}
            <div className="flex items-center gap-2 border-r border-gray-100 pr-3 mr-1">
              {[
                { id: 'isNew', label: 'New', isActive: filters.isNew, action: () => handleChange('isNew', !filters.isNew) },
                { id: 'isTrending', label: 'Trending', isActive: filters.isTrending, action: () => handleChange('isTrending', !filters.isTrending) },
                { id: 'onSale', label: 'Sale', isActive: filters.onSale, action: () => handleChange('onSale', !filters.onSale) }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className={`px-5 py-2.5 text-xs font-semibold  tracking-wide border rounded-full transition-all duration-300 whitespace-nowrap ${
                    item.isActive
                      ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200'
                      : 'text-gray-500 border-gray-100 hover:border-purple-300 hover:text-purple-600 bg-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {paginatedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-16 md:mt-20 flex flex-col items-center gap-6">
                {/* Page Info */}
                <p className="text-xs font-semibold  tracking-wide text-gray-400">
                  Showing {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(currentPage * PRODUCTS_PER_PAGE, products.length)} of {products.length} products
                </p>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  {/* Previous */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl border transition-all duration-300 ${
                      currentPage === 1
                        ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                        : 'border-[#F5F3FF] text-[#A855F7] hover:bg-[#FAF9FF] hover:border-[#E9D5FF] hover:shadow-lg hover:shadow-purple-100/50 active:scale-95'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  {getPageNumbers().map((page, idx) =>
                    page === 'ellipsis' ? (
                      <span key={`ellipsis-${idx}`} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-gray-300 text-sm font-bold tracking-wide">
                        •••
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl text-xs font-semibold  tracking-wider transition-all duration-300 ${
                          currentPage === page
                            ? 'bg-[#A855F7] text-white shadow-lg shadow-purple-200/50 scale-105'
                            : 'border border-[#F5F3FF] text-gray-500 hover:bg-[#FAF9FF] hover:border-[#E9D5FF] hover:text-[#A855F7] active:scale-95'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  {/* Next */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl border transition-all duration-300 ${
                      currentPage === totalPages
                        ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                        : 'border-[#F5F3FF] text-[#A855F7] hover:bg-[#FAF9FF] hover:border-[#E9D5FF] hover:shadow-lg hover:shadow-purple-100/50 active:scale-95'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-28">
            <div className="text-5xl mb-6">👟</div>
            <h3 className="text-2xl font-semibold  tracking-tight text-gray-900 mb-3">No products found</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-8">
              We couldn&apos;t find any products matching your filters. Try adjusting your search or explore a different category.
            </p>
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-purple-600 text-white text-xs font-semibold  tracking-wide rounded-full hover:bg-purple-700 transition-all shadow-xl shadow-purple-200"
            >
              Clear all Filters
            </button>
          </div>
        )}


      </main>

      {/* Sale Banner - Dynamically displayed when there's an active sale event */}
      {!loading && products.length > 0 && <SaleBanner />}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold  tracking-wide text-gray-400">Loading products</p>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
