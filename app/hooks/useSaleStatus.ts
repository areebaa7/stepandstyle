import { useState, useEffect } from 'react';

export interface SaleStatusInfo {
  show: boolean;
  bannerText: string;
  eventName?: string;
  count?: number;
}

export function useSaleStatus() {
  const [saleInfo, setSaleInfo] = useState<SaleStatusInfo | null>(null);

  useEffect(() => {
    const checkSale = async () => {
      try {
        const res = await fetch('/api/sale-status', { cache: 'no-store' });
        const data = await res.json();
        setSaleInfo(data);
      } catch (error) {
        console.error('Failed to check sale status', error);
      }
    };
    checkSale();
  }, []);

  return saleInfo;
}

