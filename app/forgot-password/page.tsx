'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to process your request.');
      setMessage(payload.message);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to process your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 pt-24">
        <form onSubmit={submit} className="w-full rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-600">Account recovery</p>
          <h1 className="mt-3 text-3xl font-semibold text-gray-950">Forgot password?</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">Enter your customer account email and we will send a secure reset link.</p>
          <label className="mt-6 block text-sm font-medium text-gray-700">Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></label>
          {message && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</p>}
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="mt-6 w-full rounded-xl bg-purple-600 py-3 font-semibold text-white disabled:opacity-60">{loading ? 'Sending...' : 'Send reset link'}</button>
          <Link href="/" className="mt-5 block text-center text-sm font-semibold text-purple-600">Back to store</Link>
        </form>
      </main>
    </div>
  );
}
