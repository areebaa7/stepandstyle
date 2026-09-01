'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AUTH_STATE_EVENT, type AuthState } from '@/lib/authState.client';

export interface WishlistItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  salePrice?: number;
  image: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  totalCount: number;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const WISHLIST_STORAGE_KEY = 'stepandstyle_wishlist';

function mergeWishlistItems(accountItems: WishlistItem[], guestItems: WishlistItem[]) {
  const merged = new Map<string, WishlistItem>();
  for (const item of [...accountItems, ...guestItems]) merged.set(item.id, item);
  return Array.from(merged.values());
}

function readGuestWishlist() {
  if (typeof window === 'undefined') return [];

  try {
    const saved = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed as WishlistItem[] : [];
  } catch (error) {
    console.warn('Failed to load wishlist from storage', error);
    return [];
  }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null);
  const [isSyncReady, setIsSyncReady] = useState(false);
  const itemsRef = useRef<WishlistItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const synchronizeWishlist = useCallback(async (guestItems: WishlistItem[]) => {
    setIsSyncReady(false);

    try {
      const authResponse = await fetch('/api/auth/me', { cache: 'no-store' });
      const authPayload = await authResponse.json();
      const user = authResponse.ok ? authPayload.user : null;

      if (!user || user.role === 'ADMIN') {
        setSyncedUserId(null);
        setItems(guestItems);
        setIsSyncReady(true);
        return;
      }

      const wishlistResponse = await fetch('/api/wishlist', { cache: 'no-store' });
      const wishlistPayload = await wishlistResponse.json();
      if (!wishlistResponse.ok || !wishlistPayload.success) {
        throw new Error(wishlistPayload.error || 'Unable to load synced wishlist.');
      }

      const accountItems = Array.isArray(wishlistPayload.data?.items) ? wishlistPayload.data.items : [];
      const mergedItems = mergeWishlistItems(accountItems, guestItems);

      setSyncedUserId(user.id);
      setItems(mergedItems);
      window.localStorage.removeItem(WISHLIST_STORAGE_KEY);
      setIsSyncReady(true);
    } catch (error) {
      console.warn('Unable to synchronize customer wishlist', error);
      setSyncedUserId(null);
      setItems(guestItems);
      setIsSyncReady(true);
    }
  }, []);

  useEffect(() => {
    const guestItems = readGuestWishlist();
    const initializationTimer = window.setTimeout(() => synchronizeWishlist(guestItems), 0);

    const handleAuthState = (event: Event) => {
      const state = (event as CustomEvent<AuthState>).detail;
      if (state === 'signed-out') {
        setSyncedUserId(null);
        setItems([]);
        window.localStorage.setItem(WISHLIST_STORAGE_KEY, '[]');
        setIsSyncReady(true);
        return;
      }

      synchronizeWishlist(itemsRef.current);
    };

    window.addEventListener(AUTH_STATE_EVENT, handleAuthState);
    return () => {
      window.clearTimeout(initializationTimer);
      window.removeEventListener(AUTH_STATE_EVENT, handleAuthState);
    };
  }, [synchronizeWishlist]);

  useEffect(() => {
    if (!isSyncReady) return;

    if (!syncedUserId) {
      try {
        window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.warn('Failed to persist wishlist to storage', error);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      fetch('/api/wishlist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        keepalive: true,
      }).catch((error) => console.warn('Unable to save customer wishlist', error));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [isSyncReady, items, syncedUserId]);

  const addToWishlist = (item: WishlistItem) => {
    setItems((previous) => previous.some((entry) => entry.id === item.id) ? previous : [...previous, item]);
  };

  const removeFromWishlist = (id: string) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  const isInWishlist = (id: string) => items.some((item) => item.id === id);

  return (
    <WishlistContext.Provider value={{
      items,
      totalCount: items.length,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
}
