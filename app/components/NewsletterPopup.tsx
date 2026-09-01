'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import NewsletterSignupForm from '@/app/components/NewsletterSignupForm';
import { useNewsletterSettings } from '@/app/hooks/useNewsletterSettings';

const DISMISSED_KEY = 'stepstyle_newsletter_dismissed_until';
const SUBSCRIBED_KEY = 'stepstyle_newsletter_subscribed';

export default function NewsletterPopup() {
  const pathname = usePathname();
  const settings = useNewsletterSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  const excluded =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/influencer') ||
    pathname.startsWith('/unsubscribe');

  const close = useCallback(() => {
    setIsOpen(false);
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  }, []);

  useEffect(() => {
    if (!settings.popupEnabled || excluded) return;
    const subscribed = window.localStorage.getItem(SUBSCRIBED_KEY) === 'true';
    const dismissedUntil = Number(window.localStorage.getItem(DISMISSED_KEY) || 0);
    if (subscribed || dismissedUntil > Date.now()) return;

    const timer = window.setTimeout(
      () => setIsOpen(true),
      settings.popupDelaySeconds * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [excluded, settings.popupDelaySeconds, settings.popupEnabled]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [close, isOpen]);

  const handleSuccess = (code: string | null) => {
    window.localStorage.setItem(SUBSCRIBED_KEY, 'true');
    setDiscountCode(code);
    if (!code) window.setTimeout(() => setIsOpen(false), 1200);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="newsletter-popup-title"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-7 shadow-2xl sm:p-9"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close newsletter popup"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-600 transition hover:bg-gray-200"
        >
          ×
        </button>

        <div className="mb-6 inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-700">
          Step &amp; Styl insiders
        </div>
        <h2 id="newsletter-popup-title" className="pr-8 text-3xl font-bold tracking-tight text-gray-950">
          Be first in line.
        </h2>
        <p className="mt-3 leading-7 text-gray-600">
          {settings.incentiveEnabled
            ? settings.incentiveText
            : 'Get new arrivals, private offers and style inspiration in your inbox.'}
        </p>

        {discountCode ? (
          <div className="mt-7 rounded-2xl border border-dashed border-purple-300 bg-purple-50 p-5 text-center">
            <p className="text-sm font-semibold text-purple-800">Your welcome code</p>
            <p className="mt-2 text-2xl font-black tracking-[0.2em] text-purple-950">{discountCode}</p>
            <button type="button" onClick={close} className="mt-4 text-sm font-semibold text-purple-700 underline">
              Start shopping
            </button>
          </div>
        ) : (
          <div className="mt-7">
            <NewsletterSignupForm
              source="popup"
              consentText={settings.consentText}
              privacyPolicyUrl={settings.privacyPolicyUrl}
              onSuccess={handleSuccess}
            />
          </div>
        )}
      </section>
    </div>
  );
}
