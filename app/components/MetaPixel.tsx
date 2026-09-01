'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import * as fpixel from '@/lib/fpixel';

export default function MetaPixel() {
  const [pixelId, setPixelId] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/marketing/public-settings');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.metaPixelEnabled && json.data?.metaPixelId) {
            setPixelId(json.data.metaPixelId);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch Meta Pixel settings', err);
      }
    };
    fetchSettings();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    if (pixelId) {
      if (pathname.startsWith('/admin')) return;

      // Small timeout to ensure the script has initialized
      setTimeout(() => {
        fpixel.pageview();
      }, 50);
    }
  }, [pathname, searchParams, pixelId]);

  if (!pixelId) return null;

  return (
    <Script
      id="fb-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          
          fbq('init', '${pixelId}');
        `,
      }}
    />
  );
}
