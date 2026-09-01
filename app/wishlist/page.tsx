'use client';

import Navbar from '@/app/components/Navbar';
import { useWishlist } from '@/app/context/WishlistContext';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { formatPKR } from '@/lib/currency';

export default function WishlistPage() {
  const { items, removeFromWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold  tracking-wide text-gray-900 mb-4">
            My Wishlist
          </h1>
          <p className="text-gray-500 font-medium">
            {items.length === 0 
              ? "You haven't saved any items yet." 
              : `${items.length} item${items.length === 1 ? '' : 's'} saved`}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-8 max-w-sm text-center">
              Explore our collections and tap the heart icon to save your favorite items for later.
            </p>
            <Link 
              href="/products"
              className="px-8 py-3 bg-purple-600 text-white font-bold  tracking-wide text-xs rounded-full hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-gray-100 relative flex flex-col">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeFromWishlist(item.id);
                  }}
                  className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                  title="Remove from wishlist"
                >
                  <Trash2 size={16} />
                </button>

                <Link href={`/products/${item.slug}`} className="block relative aspect-[4/5] bg-gray-50 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-2 group-hover:scale-110 transition-transform duration-700"
                  />
                </Link>

                <div className="p-5 flex flex-col flex-1">
                  <Link href={`/products/${item.slug}`} className="group-hover:text-purple-600 transition-colors">
                    <h3 className="font-bold text-gray-900  tracking-wide text-sm line-clamp-1 mb-2">
                      {item.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 mt-auto">
                    <span className="font-semibold text-purple-600">
                      {formatPKR(item.price)}
                    </span>
                    {item.salePrice && item.salePrice > item.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPKR(item.salePrice)}
                      </span>
                    )}
                  </div>
                  
                  <Link 
                    href={`/products/${item.slug}`}
                    className="mt-4 w-full block text-center py-3 bg-gray-900 text-white text-xs font-bold  tracking-wide hover:bg-purple-600 transition-colors"
                  >
                    View Product
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
