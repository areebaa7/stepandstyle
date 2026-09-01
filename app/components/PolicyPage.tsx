'use client';

import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import PrivacyContact from '@/app/components/PrivacyContact';
import ScrollAnimate from '@/app/components/ScrollAnimate';
import { useBusinessContactSettings } from '@/app/context/BusinessContactContext';
import type { StorePolicyKey } from '@/types/storefrontSettings';

const policyLinks: Array<{ key: StorePolicyKey; label: string; href: string }> = [
  { key: 'shippingPolicy', label: 'Shipping', href: '/shipping-delivery' },
  { key: 'returnsPolicy', label: 'Returns & Exchanges', href: '/returns-exchanges' },
  { key: 'privacyPolicy', label: 'Privacy', href: '/privacy-policy' },
  { key: 'termsPolicy', label: 'Terms & Conditions', href: '/terms-and-conditions' },
];

export default function PolicyPage({ policyKey, showPrivacyContact = false }: { policyKey: StorePolicyKey; showPrivacyContact?: boolean }) {
  const settings = useBusinessContactSettings();
  const policy = settings[policyKey];
  const formattedDate = new Date(`${policy.lastUpdated}T00:00:00Z`).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="px-4 pb-20 pt-24 sm:px-6 md:pt-32">
        <div className="mx-auto max-w-5xl">
          <ScrollAnimate animation="fade-in" className="rounded-[2rem] bg-gradient-to-br from-[#FAF9FF] via-white to-purple-50 px-6 py-12 text-center ring-1 ring-purple-100 sm:px-12 md:py-16">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-600">Store policy</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-5xl">{policy.title}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">{policy.summary}</p>
            <p className="mt-5 text-xs font-semibold text-gray-400">Last updated: {formattedDate}</p>
          </ScrollAnimate>

          <div className="mt-12 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
            <nav aria-label="Store policies" className="h-fit rounded-2xl border border-gray-200 bg-white p-3 lg:sticky lg:top-24">
              {policyLinks.map((item) => (
                <Link key={item.key} href={item.href} aria-current={item.key === policyKey ? 'page' : undefined} className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${item.key === policyKey ? 'bg-purple-600 text-white shadow-md shadow-purple-100' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'}`}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="space-y-6">
              {policy.sections.map((section, index) => (
                <ScrollAnimate key={section.id} animation="fade-in" delay={`${Math.min(index, 5) * 0.05}s`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-sm font-bold text-purple-700">{index + 1}</span>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-gray-950">{section.heading}</h2>
                      <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">{section.body}</p>
                    </div>
                  </div>
                </ScrollAnimate>
              ))}

              {showPrivacyContact && (
                <ScrollAnimate animation="fade-in" className="rounded-2xl border border-purple-100 bg-purple-50/60 p-6 sm:p-8">
                  <h2 className="text-xl font-bold text-gray-950">Contact for privacy requests</h2>
                  <PrivacyContact />
                </ScrollAnimate>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
