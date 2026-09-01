'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to reset your password.');
      setMessage(payload.message);
      setPassword('');
      setConfirmPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to reset your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-600">Account security</p>
      <h1 className="mt-3 text-3xl font-semibold text-gray-950">Choose a new password</h1>
      {!token && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">This reset link is missing its security token.</p>}
      <label className="mt-6 block text-sm font-medium text-gray-700">New password<input type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></label>
      <label className="mt-4 block text-sm font-medium text-gray-700">Confirm password<input type="password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></label>
      <p className="mt-3 text-xs text-gray-500">Use at least 8 characters with letters and numbers.</p>
      {message && <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">{message} You can now sign in from the store.</p>}
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={loading || !token} className="mt-6 w-full rounded-xl bg-purple-600 py-3 font-semibold text-white disabled:opacity-60">{loading ? 'Updating...' : 'Reset password'}</button>
      <Link href="/" className="mt-5 block text-center text-sm font-semibold text-purple-600">Back to store</Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return <div className="min-h-screen bg-gray-50"><Navbar /><main className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 pt-24"><Suspense fallback={<p>Loading...</p>}><ResetPasswordForm /></Suspense></main></div>;
}
