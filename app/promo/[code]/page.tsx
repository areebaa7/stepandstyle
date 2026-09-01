'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import { useCart } from '@/app/context/CartContext';

type ReferralState =
  | { status: 'loading'; message: string }
  | { status: 'success'; message: string; code: string; discountPercent: number }
  | { status: 'error'; message: string };

export default function PromoReferralPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { applyPromoCode } = useCart();
  const applyPromoRef = useRef(applyPromoCode);
  const rawCode = Array.isArray(params.code) ? params.code[0] : params.code;
  const promoCode = (rawCode || '').trim().toUpperCase();
  const [state, setState] = useState<ReferralState>({
    status: 'loading',
    message: 'Checking your referral offer...',
  });

  useEffect(() => {
    applyPromoRef.current = applyPromoCode;
  }, [applyPromoCode]);

  useEffect(() => {
    const controller = new AbortController();
    let redirectTimer: number | undefined;

    const activateReferral = async () => {
      if (!promoCode || promoCode.length > 40) {
        setState({ status: 'error', message: 'This referral link is invalid.' });
        return;
      }

      try {
        const response = await fetch('/api/promo-codes/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: promoCode }),
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok || !payload.success || !payload.code) {
          throw new Error(payload.error || 'This referral offer is not available.');
        }

        applyPromoRef.current(payload.code.code);
        setState({
          status: 'success',
          message: 'Offer applied. Taking you to the store...',
          code: payload.code.code,
          discountPercent: payload.code.discountPercent,
        });

        redirectTimer = window.setTimeout(() => {
          router.replace(`/products?promo=${encodeURIComponent(payload.code.code)}`);
        }, 1200);
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : 'This referral offer is not available.',
        });
      }
    };

    activateReferral();
    return () => {
      controller.abort();
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [promoCode, router]);

  return (
    <div className='min-h-screen bg-gradient-to-b from-purple-50 to-white'>
      <Navbar />
      <main className='mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-16'>
        <section className='w-full rounded-[32px] border border-purple-100 bg-white p-8 text-center shadow-xl shadow-purple-100/40 md:p-12'>
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl font-semibold ${
            state.status === 'success'
              ? 'bg-green-100 text-green-700'
              : state.status === 'error'
                ? 'bg-red-100 text-red-600'
                : 'animate-pulse bg-purple-100 text-purple-700'
          }`}>
            {state.status === 'success' ? '✓' : state.status === 'error' ? '!' : '%'}
          </div>

          <p className='mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-purple-600'>Affiliate referral</p>
          <h1 className='mt-3 text-3xl font-semibold tracking-tight text-gray-950'>
            {state.status === 'success' ? 'Your offer is ready' : state.status === 'error' ? 'Offer unavailable' : 'Activating your offer'}
          </h1>
          <p className='mx-auto mt-4 max-w-md text-sm leading-6 text-gray-500'>{state.message}</p>

          {state.status === 'success' && (
            <div className='mt-7 rounded-2xl border border-green-100 bg-green-50 p-5'>
              <p className='font-mono text-xl font-semibold tracking-wider text-green-800'>{state.code}</p>
              <p className='mt-1 text-sm text-green-700'>{state.discountPercent}% discount will be available at checkout.</p>
            </div>
          )}

          {state.status === 'error' && (
            <Link href='/products' className='mt-8 inline-flex rounded-full bg-purple-600 px-8 py-4 text-xs font-semibold uppercase tracking-wide text-white hover:bg-purple-700'>
              Browse the store
            </Link>
          )}
        </section>
      </main>
    </div>
  );
}
