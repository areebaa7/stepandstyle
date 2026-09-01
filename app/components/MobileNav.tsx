'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWishlist } from '@/app/context/WishlistContext';
import type { CollectionDTO } from '@/types/product';

interface MobileNavProps {
  onOpenAccount: (mode?: 'login' | 'register') => void;
  onOpenCart: () => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isInfluencer: boolean;
  isCustomer: boolean;
  cartCount: number;
  collections: CollectionDTO[];
}

export default function MobileNav({
  onOpenAccount,
  onOpenCart,
  onLogout,
  isAuthenticated,
  isAdmin,
  isInfluencer,
  isCustomer,
  cartCount,
  collections,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const { totalCount: wishlistCount } = useWishlist();

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg text-white hover:text-yellow-300 hover:bg-white/10 transition"
        aria-label="Toggle menu"
      >
        <svg
          className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          strokeWidth="2.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-lavender-dark/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FULL SOLID SIDE BAR */}
      <div
  className={`
    fixed top-0 left-0 
    h-screen w-[85vw] sm:w-80 
    bg-white 
    text-gray-900 
    shadow-2xl 
    z-50 
    transition-transform duration-500 ease-in-out
    md:hidden
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `}
>

        <div className="flex flex-col h-full p-8">

          {/* Logo + Close */}
          <div className="flex justify-between items-center mb-12">
            <Link href="/" onClick={() => setIsOpen(false)} className="group">
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold uppercase tracking-wide text-gray-900">
                  Step
                </span>
                <span className="text-xl font-bold uppercase tracking-wide text-yellow-600">
                  &
                </span>
                <span className="text-lg font-bold uppercase tracking-wide text-gray-900">
                  Styl
                </span>
              </div>
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
              className="p-2 rounded-full hover:bg-lavender-light transition-all"
            >
              <svg
                className="w-6 h-6 text-lavender-dark"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col space-y-2 flex-1 overflow-y-auto custom-scrollbar">
            <Link
              href="/products"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold tracking-wide p-4 hover:bg-lavender-light hover:text-lavender-dark rounded-xl transition-all"
            >
              All products
            </Link>

            <Link
              href="/products?gender=WOMEN"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold tracking-wide p-4 hover:bg-lavender-light hover:text-lavender-dark rounded-xl transition-all"
            >
              Women
            </Link>

            <Link
              href="/products?gender=MEN"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold tracking-wide p-4 hover:bg-lavender-light hover:text-lavender-dark rounded-xl transition-all"
            >
              Men
            </Link>

            <Link
              href="/kids"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold tracking-wide p-4 hover:bg-lavender-light hover:text-lavender-dark rounded-xl transition-all"
            >
              Kids
            </Link>

            <Link
              href="/new-arrivals"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold tracking-wide p-4 hover:bg-lavender-light hover:text-lavender-dark rounded-xl transition-all"
            >
              New arrivals
            </Link>

            {/* Category Dropdown */}
            <div>
              <button
                onClick={() => setIsCategoryOpen((prev) => !prev)}
                className="w-full text-left text-sm font-semibold tracking-wide p-4 hover:bg-lavender-light hover:text-lavender-dark rounded-xl flex items-center justify-between transition-all"
              >
                <span>Collections</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isCategoryOpen && (
                <div className="ml-4 mt-2 space-y-1 border-l-2 border-lavender-light pl-4">
                  {collections.length === 0 ? (
                    <span className="block px-3 py-2 text-gray-400 text-xs italic tracking-wide">No collections</span>
                  ) : (
                    collections.map((coll) => (
                      <Link
                        key={coll.id}
                        href={`/products?collectionId=${coll.id}`}
                        onClick={() => {
                          setIsOpen(false);
                          setIsCategoryOpen(false);
                        }}
                        className="block text-xs font-bold tracking-wide p-3 hover:text-lavender-dark transition-colors"
                      >
                        {coll.name}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="h-[1px] bg-lavender-light my-4 mx-4" />

            <Link
              href="/wishlist"
              onClick={() => setIsOpen(false)}
              className="flex justify-between items-center text-sm font-semibold tracking-wide p-4 hover:bg-lavender-light hover:text-lavender-dark rounded-xl transition-all"
            >
              Wishlist
              {wishlistCount > 0 && (
                <span className="bg-yellow-300 text-[#A855F7] px-2 py-0.5 rounded-full text-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/#about"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold tracking-wide p-4 hover:bg-lavender-light hover:text-lavender-dark rounded-xl transition-all"
            >
              Our story
            </Link>

            <Link
              href="/affiliate"
              onClick={() => setIsOpen(false)}
              className="text-sm font-semibold tracking-wide p-4 text-[#6B21A8] bg-[#F5F3FF] rounded-xl transition-all"
            >
              Affiliate
            </Link>

            {/* Account Section */}
            <div>
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    setIsAccountOpen((prev) => !prev);
                  } else {
                    setIsOpen(false);
                    onOpenAccount('login');
                  }
                }}
                className={`w-full text-left text-sm font-semibold tracking-wide p-4 border rounded-xl flex items-center justify-between transition-all ${
                  isAuthenticated ? 'border-lavender-main bg-white text-lavender-dark' : 'border-lavender-main hover:bg-lavender-light'
                }`}
              >
                <span>{isAuthenticated ? 'My account' : 'Sign in'}</span>
                {isAuthenticated && (
                  <svg
                    className={`w-4 h-4 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              
              {isAuthenticated && isAccountOpen && (
                <div className="ml-4 mt-2 space-y-1 border-l-2 border-lavender-light pl-4">
                  {isCustomer && (
                    <Link
                      href="/account"
                      onClick={() => setIsOpen(false)}
                      className="block text-xs font-bold tracking-wide p-3 hover:text-lavender-dark transition-colors text-purple-600"
                    >
                      My account
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="block text-xs font-bold tracking-wide p-3 hover:text-lavender-dark transition-colors text-purple-600"
                    >
                      Admin console
                    </Link>
                  )}
                  {isInfluencer && (
                    <Link
                      href="/influencer"
                      onClick={() => setIsOpen(false)}
                      className="block text-xs font-bold tracking-wide p-3 hover:text-lavender-dark transition-colors text-purple-600"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left text-xs font-bold tracking-wide p-3 text-red-500 hover:text-red-700 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Cart Button */}
          <button
            className="w-full bg-[#A855F7] text-white font-semibold  tracking-wide py-5 mt-8 rounded-2xl shadow-xl hover:bg-[#9333EA] hover:shadow-purple-500/30 transition-all"
            onClick={() => {
              setIsOpen(false);
              onOpenCart();
            }}
          >
            My cart ({cartCount})
          </button>
        </div>
      </div>
    </>
  );
}
