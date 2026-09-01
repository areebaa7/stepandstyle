'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import * as fpixel from '@/lib/fpixel';

function OrderConfirmation() {
  const searchParams = useSearchParams();
  const [hasCopied, setHasCopied] = useState(false);
  const orderId = searchParams.get('orderId')?.trim() || '';
  const claim = searchParams.get('claim')?.trim() || '';
  const displayOrderId = orderId ? orderId.slice(-8).toUpperCase() : '';

  useEffect(() => {
    if (!orderId || !claim) return;
    const trackPurchase = async () => {
      try {
        const verification = await fetch('/api/marketing/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, token: claim }),
        });
        const verified = await verification.json();
        if (!verification.ok || !verified.success || !verified.shouldTrack) return;
        const conversion = verified.data;
        fpixel.event('Purchase', {
          value: conversion.value,
          currency: conversion.currency,
          order_id: conversion.orderId,
          num_items: conversion.numItems,
          content_ids: conversion.contentIds,
        });

        try {
          const response = await fetch('/api/marketing/public-settings', { cache: 'no-store' });
          const payload = await response.json();
          const destination = payload.data?.googleAdsConversionId;
          if (!response.ok || !payload.success || !destination) return;

          window.dataLayer = window.dataLayer || [];
          const gtag = window.gtag || ((...args: unknown[]) => window.dataLayer?.push(args));
          gtag('event', 'conversion', {
            send_to: destination,
            value: conversion.value,
            currency: conversion.currency,
            transaction_id: conversion.orderId,
          });
        } catch (error) {
          console.warn('Unable to send Google Ads conversion', error);
        }
      } catch (error) {
        console.warn('Unable to verify completed order conversion', error);
      }
    };
    void trackPurchase();
  }, [claim, orderId]);

  const copyOrderId = async () => {
    if (!orderId) return;

    try {
      await navigator.clipboard.writeText(orderId);
      setHasCopied(true);
      window.setTimeout(() => setHasCopied(false), 2000);
    } catch {
      setHasCopied(false);
    }
  };

  if (!orderId) {
    return (
      <section className='w-full max-w-2xl rounded-[32px] border border-amber-100 bg-white p-8 text-center shadow-xl md:p-12'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-2xl text-amber-600' aria-hidden='true'>!</div>
        <p className='mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-amber-600'>Order reference missing</p>
        <h1 className='mt-3 text-3xl font-semibold tracking-tight text-gray-950'>We can&apos;t open this confirmation</h1>
        <p className='mx-auto mt-4 max-w-md text-sm leading-6 text-gray-500'>
          Please use the confirmation link shown after checkout, or check your email for your order reference.
        </p>
        <Link href='/products' className='mt-8 inline-flex rounded-full bg-purple-600 px-8 py-4 text-xs font-semibold uppercase tracking-wide text-white hover:bg-purple-700'>
          Continue shopping
        </Link>
      </section>
    );
  }

  return (
    <section className='flex w-full max-w-2xl flex-col items-center rounded-[40px] border border-gray-100 bg-white p-8 text-center shadow-xl md:p-12'>
      <div className='relative'>
        <div className='absolute inset-0 scale-150 animate-pulse rounded-full bg-purple-200 opacity-30 blur-3xl' />
        <div className='relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 shadow-xl shadow-purple-100'>
          <svg className='h-10 w-10 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
          </svg>
        </div>
      </div>

      <header className='mt-8'>
        <p className='text-xs font-semibold uppercase tracking-[0.35em] text-purple-600'>Step &amp; Styl confirmation</p>
        <h1 className='mt-4 text-3xl font-semibold leading-tight tracking-tight text-gray-900 md:text-5xl'>Order placed successfully</h1>
      </header>

      <p className='mt-5 max-w-md text-sm font-medium leading-relaxed text-gray-500'>
        Thank you for your order. We&apos;ve received it and sent a confirmation email with the details.
      </p>

      <div className='mt-8 w-full rounded-2xl border border-purple-100 bg-purple-50/60 p-5'>
        <p className='text-[11px] font-semibold uppercase tracking-[0.25em] text-purple-500'>Order number</p>
        <p className='mt-2 text-xl font-semibold tracking-wide text-gray-950'>#{displayOrderId}</p>
        <p className='mt-2 break-all text-xs text-gray-500'>{orderId}</p>
        <button
          type='button'
          onClick={copyOrderId}
          className='mt-4 rounded-full border border-purple-200 bg-white px-5 py-2 text-xs font-semibold text-purple-700 transition hover:border-purple-300 hover:bg-purple-100'
          aria-live='polite'
        >
          {hasCopied ? 'Copied' : 'Copy order ID'}
        </button>
      </div>

      <p className='mt-5 text-xs leading-5 text-gray-400'>Keep this reference handy if you contact us about your order.</p>

      <div className='mt-8 grid w-full gap-3 sm:grid-cols-2'>
        <Link href='/' className='rounded-full bg-purple-600 px-8 py-4 text-xs font-semibold uppercase tracking-wide text-white shadow-xl shadow-purple-100 transition hover:bg-purple-700 active:scale-95'>
          Continue shopping
        </Link>
        <Link href='/account' className='rounded-full border border-gray-200 px-8 py-4 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700'>
          View my orders
        </Link>
      </div>
    </section>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <div className='max-w-[1440px] mx-auto px-4 md:px-10 py-10 md:py-20 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]'>

        <Suspense fallback={<div className='h-[520px] w-full max-w-2xl animate-pulse rounded-[40px] border border-gray-100 bg-white' />}>
          <OrderConfirmation />
        </Suspense>

        {/* Brand Decoration */}
        <div className="mt-12 opacity-10 flex gap-8 grayscale select-none">
          <div className="flex items-center">
            <Image src="/logo_main.png" alt="Step & Styl" width={120} height={40} className="h-10 w-auto" />
            <div className="flex items-center -ml-4 mb-0.5 gap-1">
              <span className="text-xs font-semibold  tracking-wide text-gray-900">
                Step
              </span>
              <span className="text-[12px] font-semibold  tracking-wide text-yellow-600">
                &
              </span>
              <span className="text-xs font-semibold  tracking-wide text-gray-900">
                Style
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
