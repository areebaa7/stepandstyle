'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NewsletterSignupFormProps {
  source: 'footer' | 'popup';
  consentText: string;
  privacyPolicyUrl: string;
  variant?: 'dark' | 'light';
  stacked?: boolean;
  onSuccess?: (discountCode: string | null) => void;
}

export default function NewsletterSignupForm({
  source,
  consentText,
  privacyPolicyUrl,
  variant = 'light',
  stacked = false,
  onSuccess,
}: NewsletterSignupFormProps) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDark = variant === 'dark';

  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!consent) {
      setStatus('Please agree to receive marketing emails.');
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus('');
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent, source }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to subscribe.');

      const discountCode = typeof payload.discountCode === 'string' ? payload.discountCode : null;
      setEmail('');
      setConsent(false);
      setStatus(discountCode ? `Subscribed! Your code is ${discountCode}.` : 'Thanks — you are subscribed.');
      onSuccess?.(discountCode);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to subscribe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={subscribe} className="w-full">
      <div className={`flex gap-2 ${stacked ? 'flex-col' : 'flex-col sm:flex-row'}`}>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email address"
          aria-label="Email address for newsletter"
          className={`min-w-0 flex-1 rounded-full border px-5 py-3 text-sm outline-none ${
            isDark
              ? 'border-white/15 bg-white/10 text-white placeholder:text-white/40 focus:border-purple-400'
              : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-purple-500'
          }`}
        />
        <button
          disabled={isSubmitting}
          className={`rounded-full bg-purple-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-purple-500 disabled:opacity-50 ${stacked ? 'self-start' : ''}`}
        >
          {isSubmitting ? 'Joining...' : 'Subscribe'}
        </button>
      </div>
      <label className={`mt-3 flex cursor-pointer items-start gap-2 text-xs leading-5 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        <span>
          {consentText}{' '}
          <Link href={privacyPolicyUrl} className="font-semibold underline">
            Privacy policy
          </Link>
        </span>
      </label>
      {status && (
        <p className={`mt-2 text-xs ${isDark ? 'text-purple-200' : 'text-purple-700'}`} aria-live="polite">
          {status}
        </p>
      )}
    </form>
  );
}
