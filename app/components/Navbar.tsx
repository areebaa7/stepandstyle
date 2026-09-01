"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import MobileNav from "./MobileNav";
import AccountModal, { AuthMode, AuthUser } from "./AccountModal";
import CartDrawer from "./CartDrawer";
import { useSaleStatus } from "../hooks/useSaleStatus";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import type { CollectionDTO } from "@/types/product";
import { User, Heart, ShoppingBag, Sparkles } from "lucide-react";
import { notifyAuthState } from "@/lib/authState.client";

const NAV_LINKS = [
  { href: '/kids', label: 'Kids' },
  { href: '/products?gender=MEN', label: 'Men' },
  { href: '/products?gender=WOMEN', label: 'Women' },
  { href: '/new-arrivals', label: 'New arrivals' },
];

const navWrap =
  'relative inline-flex items-stretch rounded-full border border-white/25 bg-black/25 backdrop-blur-md shadow-lg shadow-purple-950/40 p-1';
const linkBase =
  'relative flex items-center rounded-full px-3.5 lg:px-5 py-2.5 text-[11px] lg:text-xs font-bold uppercase tracking-[0.14em] whitespace-nowrap transition-all duration-300 active:scale-95';
const linkActive =
  'bg-gradient-to-r from-amber-400 to-yellow-300 text-purple-950 font-black shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-[1.02]';
const linkIdle =
  'text-white/90 hover:text-white hover:bg-white/15 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]';

function NavPillLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const saleInfo = useSaleStatus();

  const isActive = (href: string) => {
    const [path, query] = href.split('?');
    if (pathname !== path) return false;
    if (!query) return true;
    return searchParams.get('gender') === new URLSearchParams(query).get('gender');
  };

  return (
    <>
      {NAV_LINKS.map((link, index) => (
        <Link
          key={link.href}
          href={link.href}
          className={`${linkBase} ${index === 0 ? 'pl-4 lg:pl-5' : ''} ${isActive(link.href) ? linkActive : linkIdle}`}
        >
          {link.label}
        </Link>
      ))}

      {saleInfo?.show && (
        <Link
          href="/sales"
          className={`${linkBase} ${isActive('/sales') ? linkActive : linkIdle}`}
        >
          <span className="inline-flex items-center gap-2">
            Sale
            <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          </span>
        </Link>
      )}
    </>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalMode, setAccountModalMode] = useState<AuthMode>('register');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const { totalCount: cartCount, isCartOpen, setIsCartOpen } = useCart();
  const { totalCount: wishlistCount } = useWishlist();
  const isAdmin = authUser?.role === 'ADMIN';
  const isInfluencer = authUser?.role === 'INFLUENCER';
  const isCustomer = authUser?.role === 'USER';
  const [collections, setCollections] = useState<CollectionDTO[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (data.user) {
          setAuthUser(data.user);
        }
      } catch {
        // Ignore
      }
    };

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

    fetchCurrentUser();
    fetchCollections();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openAccountModal = useCallback((mode: AuthMode = 'login') => {
    setAccountModalMode(mode);
    setIsAccountModalOpen(true);
    setIsAccountMenuOpen(false);
  }, []);

  const handleAuthSuccess = useCallback((user: AuthUser) => {
    setAuthUser(user);
    setIsAccountModalOpen(false);
    setIsAccountMenuOpen(false);

    if (user.role === 'ADMIN') {
      window.location.href = '/admin';
    } else if (user.role === 'INFLUENCER') {
      window.location.href = '/influencer';
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      notifyAuthState('signed-out');
      setAuthUser(null);
      setIsAccountMenuOpen(false);
    }
  }, []);

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-gradient-to-r from-[#2E073F] via-[#4A0E4E] to-[#2E073F]/98 backdrop-blur-lg shadow-2xl shadow-purple-950/50 border-b border-white/10'
        : 'bg-gradient-to-r from-[#3B0764] via-[#581C87] to-[#3B0764] border-b border-white/10'
        }`}>
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <div className="flex-1 flex justify-start">
              <Link href="/" className="group flex items-center -ml-1 sm:-ml-3">
                <Image
                  src="/logo_main.png"
                  alt="Step & Styl"
                  width={400}
                  height={150}
                  className="object-contain h-24 md:h-28 lg:h-32 w-auto transition-all duration-300 group-hover:scale-[1.25] brightness-0 invert origin-left transform scale-125 md:scale-110 lg:scale-[1.15] xl:scale-[1.2] -ml-6"
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-[2.5] justify-center items-center h-full">
              <div className={navWrap}>
                <Suspense fallback={null}>
                  <NavPillLinks />
                </Suspense>

                {/* Category Dropdown */}
                <div className="relative" ref={categoryMenuRef}>
                  <button
                    onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
                    className={`${linkBase} cursor-pointer pr-4 lg:pr-5 ${isCategoryMenuOpen ? linkActive : linkIdle}`}
                  >
                    <span className="inline-flex items-center">
                      Category
                      <svg
                        className={`ml-1.5 w-3 h-3 transition-transform duration-300 ${isCategoryMenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>

                  {isCategoryMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-72 bg-white shadow-2xl border border-[#F5F3FF] py-5 z-50 rounded-xl max-h-[70vh] overflow-y-auto no-scrollbar">
                      {collections.length === 0 ? (
                        <span className="block px-8 py-2 text-gray-400 text-xs italic tracking-wide">No collections</span>
                      ) : (
                        (['WOMEN', 'MEN', 'KIDS'] as const).map((gender) => {
                          const grouped = collections.filter((c) => c.targetGender === gender);
                          if (grouped.length === 0) return null;
                          return (
                            <div key={gender}>
                              <p className="px-8 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#A855F7]">
                                {gender.charAt(0) + gender.slice(1).toLowerCase()}
                              </p>
                              {grouped.map((coll) => (
                                <Link
                                  key={coll.id}
                                  href={`/products?collectionId=${coll.id}`}
                                  onClick={() => setIsCategoryMenuOpen(false)}
                                  className="block px-8 py-2.5 text-xs font-semibold tracking-wide text-gray-900 hover:bg-[#F5F3FF] hover:text-[#6B21A8] transition-colors"
                                >
                                  {coll.name}
                                </Link>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Icons (Extreme Right) */}
            <div className="hidden md:flex flex-1 justify-end items-center gap-1 lg:gap-1.5 h-full">
              {/* Account Dropdown */}
              <div className="relative" ref={accountMenuRef}>
                <button
                  onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                  className="p-2.5 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                  aria-label="Account"
                >
                  <User className="w-5 h-5" />
                  {authUser && (
                    <span className="text-xs font-semibold max-w-[100px] truncate hidden xl:inline text-amber-300">
                      {authUser.name}
                    </span>
                  )}
                </button>

                {isAccountMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-2xl border border-gray-100 py-2.5 z-50 rounded-xl text-gray-800">
                    {authUser ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs font-bold text-gray-900 truncate">{authUser.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{authUser.email}</p>
                        </div>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="block px-4 py-2 text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                          >
                            Admin Dashboard
                          </Link>
                        )}
                        {isInfluencer && (
                          <Link
                            href="/influencer"
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="block px-4 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                          >
                            Influencer Portal
                          </Link>
                        )}
                        {isCustomer && (
                          <Link
                            href="/account"
                            onClick={() => setIsAccountMenuOpen(false)}
                            className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            My Account
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                        >
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => openAccountModal('login')}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          Sign In
                        </button>
                        <button
                          onClick={() => openAccountModal('register')}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          Create Account
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="p-2.5 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors relative"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 text-purple-950 text-[10px] font-bold flex items-center justify-center shadow">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart Drawer Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2.5 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 text-purple-950 text-[10px] font-bold flex items-center justify-center shadow">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Affiliate Link */}
              <Link
                href="/affiliate"
                className="ml-2 hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 text-purple-950 text-[11px] font-bold uppercase tracking-wider hover:bg-yellow-300 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Affiliate</span>
              </Link>
            </div>

            {/* Mobile Nav Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 rounded-full text-white hover:bg-white/10 transition relative"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-amber-400 text-purple-950 text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              <MobileNav
                onOpenAccount={openAccountModal}
                onOpenCart={() => setIsCartOpen(true)}
                onLogout={handleLogout}
                isAuthenticated={Boolean(authUser)}
                isAdmin={isAdmin}
                isInfluencer={isInfluencer}
                isCustomer={isCustomer}
                cartCount={cartCount}
                collections={collections}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        mode={accountModalMode}
        onModeChange={setAccountModalMode}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
