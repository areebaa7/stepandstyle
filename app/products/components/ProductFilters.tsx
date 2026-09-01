'use client';

import { useEffect, useState } from 'react';
import type { CollectionDTO } from '@/types/product';

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters: FilterState;
}

export interface FilterState {
  search: string;
  collectionId: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
  inStock: boolean | null;
  gender: string;
}

export default function ProductFilters({ onFilterChange, initialFilters }: ProductFiltersProps) {
  const [collections, setCollections] = useState<CollectionDTO[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

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

  const handleChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      search: '',
      collectionId: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      inStock: null,
      gender: '',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Mobile Toggle */}
      <div className="lg:hidden p-4 flex justify-between items-center bg-[#F5F3FF]">
        <h3 className="font-bold text-gray-900">Filters</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[#6B21A8] font-semibold flex items-center gap-1"
        >
          {isOpen ? 'Close' : 'Show filters'}
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className={`${isOpen ? 'block' : 'hidden'} lg:block p-6 space-y-8`}>
        {/* Search */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2  tracking-wide">Search</label>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 focus:ring-2 focus:ring-[#E9D5FF] focus:border-transparent outline-none transition-all text-gray-700 bg-gray-50/50"
            />
            <svg
              className="absolute left-3 top-3 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-3  tracking-wide">Shop for</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: '', label: 'All' },
              { id: 'MEN', label: 'Men' },
              { id: 'WOMEN', label: 'Women' },
              { id: 'UNISEX', label: 'Unisex' }
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => handleChange('gender', g.id)}
                className={`text-center px-4 py-2 rounded-lg transition-all text-xs font-bold  tracking-wide border ${
                  filters.gender === g.id
                    ? 'bg-[#6B21A8] text-white border-[#6B21A8] shadow-md'
                    : 'text-gray-600 border-gray-100 hover:bg-[#F5F3FF] hover:text-[#6B21A8]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-3  tracking-wide">Category</label>
          <div className="space-y-2">
            <button
              onClick={() => handleChange('collectionId', '')}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all text-xs font-bold  tracking-wide ${
                filters.collectionId === ''
                  ? 'bg-[#6B21A8] text-white shadow-md'
                  : 'text-gray-600 hover:bg-[#F5F3FF] hover:text-[#6B21A8]'
              }`}
            >
              All Categories
            </button>
            {collections.map((coll) => (
              <button
                key={coll.id}
                onClick={() => handleChange('collectionId', coll.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all text-xs font-bold  tracking-wide ${
                  filters.collectionId === coll.id
                    ? 'bg-[#6B21A8] text-white shadow-md'
                    : 'text-gray-600 hover:bg-[#F5F3FF] hover:text-[#6B21A8]'
                }`}
              >
                {coll.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-3  tracking-wide">Price Range (PKR)</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handleChange('minPrice', e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-[#E9D5FF] focus:border-transparent outline-none transition-all text-gray-700 bg-gray-50/50"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-100 focus:ring-2 focus:ring-[#E9D5FF] focus:border-transparent outline-none transition-all text-gray-700 bg-gray-50/50"
            />
          </div>
        </div>

        {/* Sorting */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2  tracking-wide">Sort by</label>
          <select
            value={filters.sort}
            onChange={(e) => handleChange('sort', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:ring-2 focus:ring-[#E9D5FF] focus:border-transparent outline-none transition-all appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em] text-gray-700 bg-gray-50/50"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")' }}
          >
            <option value="newest">Newest first</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        {/* Stock Status */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <input
            type="checkbox"
            id="inStockOnly"
            checked={filters.inStock === true}
            onChange={(e) => handleChange('inStock', e.target.checked ? true : null)}
            className="w-5 h-5 text-[#6B21A8] border-gray-300 rounded focus:ring-[#A855F7]"
          />
          <label htmlFor="inStockOnly" className="text-xs font-bold  tracking-wide text-gray-600 cursor-pointer">
            In Stock Only
          </label>
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-full py-3 rounded-xl border-2 border-gray-100 text-gray-400 text-xs font-bold  tracking-wide hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
