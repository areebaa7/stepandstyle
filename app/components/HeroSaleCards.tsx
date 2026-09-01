'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ActiveSale {
  id: string;
  eventName: string;
  bannerText: string;
  discountPercent: number;
}

interface SaleStatus {
  show: boolean;
  events: ActiveSale[];
}

const STORAGE_KEY = 'step_styl_hidden_hero_sale_cards';

export default function HeroSaleCards() {
  const [saleStatus, setSaleStatus] = useState<SaleStatus | null>(null);
  const [hiddenEventIds, setHiddenEventIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/sale-status', { cache: 'no-store' });
        const data = await response.json();
        setSaleStatus(data);
        try {
          const stored = sessionStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            setHiddenEventIds(Array.isArray(parsed) ? parsed : []);
          }
        } catch {
          // ignore storage errors
        }
      } catch (error) {
        console.warn('Unable to load hero sale card', error);
      }
    };
    void load();
  }, []);

  const visibleEvents = (saleStatus?.events || []).filter((sale) => !hiddenEventIds.includes(sale.id));

  if (!saleStatus?.show || visibleEvents.length === 0) return null;

  const hideCard = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const next = [...hiddenEventIds, id];
    setHiddenEventIds(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div className="absolute right-3 sm:right-6 top-3 sm:top-6 z-30 flex flex-col items-end gap-2">
      {visibleEvents.map((sale) => (
        <Link
          key={sale.id}
          href="/sales"
          className="group relative block rounded-xl bg-[#D9381E] px-6 sm:px-10 py-4 sm:py-5 shadow-2xl border border-white/20 transition-all duration-300 hover:scale-105"
        >
          <span className="block text-xl sm:text-3xl font-black uppercase tracking-wider text-white leading-tight drop-shadow">
            UPTO {sale.discountPercent}% OFF
          </span>
          <span className="mt-1 block text-center text-xs sm:text-sm font-semibold uppercase tracking-widest text-white/90">
            {sale.eventName} · Shop Now →
          </span>
          <button
            type="button"
            onClick={hideCard(sale.id)}
            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-white text-xs shadow-md transition hover:bg-black hover:scale-110"
            aria-label={`Hide ${sale.eventName} offer`}
          >
            ✕
          </button>
        </Link>
      ))}
    </div>
  );
}
