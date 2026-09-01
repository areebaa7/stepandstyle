'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';

interface PublicMarketingSettings {
  ga4MeasurementId?: string | null;
  gtmContainerId?: string | null;
  googleAdsConversionId?: string | null;
}

export default function MarketingScripts() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<PublicMarketingSettings>({});

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/marketing/public-settings', { cache: 'no-store' });
        const payload = await response.json();
        if (response.ok && payload.success && payload.data) setSettings(payload.data);
      } catch (error) {
        console.warn('Unable to load marketing scripts', error);
      }
    };
    loadSettings();
  }, []);

  if (pathname.startsWith('/admin')) return null;

  const ga4Id = settings.ga4MeasurementId || process.env.NEXT_PUBLIC_GA_ID || '';
  const gtmId = settings.gtmContainerId || process.env.NEXT_PUBLIC_GTM_ID || '';
  const googleAdsDestination = settings.googleAdsConversionId || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || '';
  const googleAdsId = googleAdsDestination.split('/')[0];

  return (
    <>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      {ga4Id && <GoogleAnalytics gaId={ga4Id} />}
      {googleAdsId && !ga4Id && (
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`} strategy="afterInteractive" />
      )}
      {googleAdsId && (
        <Script id="google-ads-config" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} window.gtag = window.gtag || gtag; gtag('js', new Date()); gtag('config', '${googleAdsId}');`}
        </Script>
      )}
    </>
  );
}
