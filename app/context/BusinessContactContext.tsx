'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DEFAULT_STOREFRONT_SETTINGS } from '@/lib/storefrontSettings';
import type { StorefrontSettingsDTO } from '@/types/storefrontSettings';

const BusinessContactContext = createContext<StorefrontSettingsDTO>(DEFAULT_STOREFRONT_SETTINGS);

export function BusinessContactProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settings, setSettings] = useState(DEFAULT_STOREFRONT_SETTINGS);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    let active = true;
    const load = async () => {
      try {
        const response = await fetch('/api/storefront-settings', { cache: 'no-store' });
        const payload = await response.json();
        if (active && response.ok && payload.success && payload.data) setSettings(payload.data);
      } catch {
        // Optional contact links remain hidden when public settings are unavailable.
      }
    };
    void load();
    return () => { active = false; };
  }, [pathname]);

  return <BusinessContactContext.Provider value={settings}>{children}</BusinessContactContext.Provider>;
}

export function useBusinessContactSettings() {
  return useContext(BusinessContactContext);
}
