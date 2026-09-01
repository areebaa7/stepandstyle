'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function UnsubscribePage() {
  const [message, setMessage] = useState('Processing your request...');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    const unsubscribe = async () => {
      try {
        const response = await fetch('/api/newsletter/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to unsubscribe.');
        setSuccess(true);
        setMessage('You have been unsubscribed from marketing emails.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to unsubscribe.');
      }
    };
    void unsubscribe();
  }, []);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4 py-16">
      <section className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full text-xl ${success ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
          {success ? '✓' : '✉'}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Email preferences</h1>
        <p className="mt-3 text-gray-600" aria-live="polite">{message}</p>
        <Link href="/" className="mt-7 inline-flex rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700">
          Return to store
        </Link>
      </section>
    </main>
  );
}
