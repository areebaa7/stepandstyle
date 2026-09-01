'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';

function VerificationResult() {
  const status = useSearchParams().get('status');
  const success = status === 'success';
  const title = success ? 'Email verified' : status === 'invalid' ? 'Link expired or invalid' : 'Verification unavailable';
  const text = success
    ? 'Your account is secure. Eligible guest orders using this email have also been connected to your account.'
    : 'Please sign in to your account and request a new verification email.';

  return (
    <div className="w-full rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl ${success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{success ? '✓' : '!'}</div>
      <h1 className="mt-5 text-3xl font-semibold text-gray-950">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-gray-500">{text}</p>
      <Link href={success ? '/account' : '/'} className="mt-6 inline-flex rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white">{success ? 'Go to my account' : 'Back to store'}</Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <div className="min-h-screen bg-gray-50"><Navbar /><main className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 pt-24"><Suspense fallback={<p>Loading...</p>}><VerificationResult /></Suspense></main></div>;
}
