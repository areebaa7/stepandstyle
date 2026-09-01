'use client';

import { useEffect, useState } from 'react';

export interface PublicNewsletterSettings {
  popupEnabled: boolean;
  popupDelaySeconds: number;
  incentiveEnabled: boolean;
  incentiveText: string;
  consentText: string;
  consentVersion: string;
  privacyPolicyUrl: string;
}

export const DEFAULT_PUBLIC_NEWSLETTER_SETTINGS: PublicNewsletterSettings = {
  popupEnabled: true,
  popupDelaySeconds: 20,
  incentiveEnabled: false,
  incentiveText: 'Join our list for private offers and new arrivals.',
  consentText: 'I agree to receive marketing emails from Step & Styl. I can unsubscribe at any time.',
  consentVersion: '2026-01',
  privacyPolicyUrl: '/privacy-policy',
};

export function useNewsletterSettings() {
  const [settings, setSettings] = useState(DEFAULT_PUBLIC_NEWSLETTER_SETTINGS);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/marketing/public-settings', { cache: 'no-store' });
        const payload = await response.json();
        if (response.ok && payload.success && payload.data?.newsletter) {
          setSettings({ ...DEFAULT_PUBLIC_NEWSLETTER_SETTINGS, ...payload.data.newsletter });
        }
      } catch (error) {
        console.warn('Unable to load newsletter settings', error);
      }
    };
    void load();
  }, []);

  return settings;
}
