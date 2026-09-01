'use client';

import { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import ScrollAnimate from '@/app/components/ScrollAnimate';
import { useBusinessContactSettings } from '@/app/context/BusinessContactContext';
import { formatPKR } from '@/lib/currency';

export default function AffiliateProgramPage() {
  const { affiliateProgram } = useBusinessContactSettings();
  const [form, setForm] = useState({ email: '', channelLink1: '', channelLink2: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const highestCommission = Math.max(affiliateProgram.defaultCommissionPercent, ...affiliateProgram.tiers.map((tier) => tier.commissionPercent));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);
    try {
      const response = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Unable to submit your application.');
      setForm({ email: '', channelLink1: '', channelLink2: '' });
      setNotice({ type: 'success', message: 'Application received. We will contact you after admin review.' });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Unable to submit your application.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="px-4 pb-24 pt-24 sm:px-6 md:pt-32">
        <div className="mx-auto max-w-6xl">
          <ScrollAnimate animation="fade-in" className="overflow-hidden rounded-[2rem] bg-[#110C1F] px-6 py-14 text-white sm:px-12 md:py-20">
            <div className="grid items-center gap-10 md:grid-cols-[1.25fr_0.75fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-400">Step &amp; Styl partners</p>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">Share products.<br /><span className="text-purple-300">Earn commission.</span></h1>
                <p className="mt-6 max-w-2xl leading-7 text-white/70">Apply for a reviewed affiliate account, receive trackable promo codes, and follow your attributed orders from the influencer dashboard.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-7 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Published commission</p>
                <p className="mt-3 text-5xl font-black text-amber-400">Up to {highestCommission}%</p>
                <p className="mt-3 text-sm text-white/60">Configured tiers and individual approval terms apply.</p>
              </div>
            </div>
          </ScrollAnimate>

          <section className="py-16 md:py-24">
            <div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Program overview</p><h2 className="mt-2 text-3xl font-bold text-gray-950">Commission tiers</h2></div>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full min-w-[620px] text-left">
                <thead className="bg-purple-50 text-xs uppercase tracking-wide text-purple-700"><tr><th className="px-6 py-4">Tier</th><th className="px-6 py-4">Commission</th><th className="px-6 py-4">Qualification</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {affiliateProgram.tiers.map((tier) => <tr key={tier.id}><td className="px-6 py-5 font-bold text-gray-900">{tier.name}</td><td className="px-6 py-5 font-bold text-purple-700">{tier.commissionPercent}% per eligible order</td><td className="px-6 py-5 text-gray-600">{tier.qualification}</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat label="Attribution duration" value={`${affiliateProgram.attributionDays} days`} />
              <Stat label="Payout schedule" value={affiliateProgram.payoutSchedule} />
              <Stat label="Minimum payout" value={formatPKR(affiliateProgram.minimumPayoutPkr)} />
            </div>
          </section>

          <section className="grid gap-8 border-y border-gray-100 py-16 md:grid-cols-2 md:py-24">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">How it works</p><h2 className="mt-2 text-3xl font-bold text-gray-950">Clear attribution and reporting</h2><div className="mt-8 space-y-4">{['Apply and pass admin review.', 'Receive a personal profile and promo codes.', 'Share your code or referral link with your audience.', 'Track attributed orders and estimated commission in your dashboard.'].map((item, index) => <div key={item} className="flex gap-4 rounded-2xl bg-purple-50/60 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white">{index + 1}</span><p className="pt-1 text-sm font-semibold leading-6 text-gray-700">{item}</p></div>)}</div></div>
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Payout</p><h2 className="mt-2 text-3xl font-bold text-gray-950">Published methods</h2><div className="mt-8 rounded-2xl border border-gray-200 p-6"><p className="text-sm text-gray-500">Available payout methods</p><div className="mt-4 flex flex-wrap gap-2">{affiliateProgram.payoutMethods.map((method) => <span key={method} className="rounded-full bg-gray-900 px-4 py-2 text-sm font-bold text-white">{method}</span>)}</div><p className="mt-6 text-sm leading-6 text-gray-600">Commission becomes earned when an order reaches: <strong>{affiliateProgram.eligibleOrderStatuses.join(', ')}</strong>.</p><p className="mt-3 text-sm leading-6 text-gray-600">Cancelled-order clawback: <strong>{affiliateProgram.cancelledOrderClawback ? 'Enabled' : 'Disabled'}</strong>. Returned/refunded-order clawback: <strong>{affiliateProgram.returnedOrderClawback ? 'Enabled' : 'Disabled'}</strong>.</p></div></div>
          </section>

          <section className="grid gap-10 py-16 md:grid-cols-[0.9fr_1.1fr] md:py-24">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Program terms</p><h2 className="mt-2 text-3xl font-bold text-gray-950">Know the rules before applying</h2><ul className="mt-7 space-y-4">{affiliateProgram.publicTerms.map((term) => <li key={term} className="flex gap-3 text-sm leading-6 text-gray-600"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-purple-600" />{term}</li>)}</ul></div>
            <div className="rounded-3xl border border-purple-100 bg-[#FAF9FF] p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-950">Apply for affiliate</h2>
              {!affiliateProgram.enabled ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold leading-6 text-amber-800">New affiliate applications are currently paused. Existing approved affiliates can continue using their dashboard.</div> : (
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <FormField label="Email address" type="email" value={form.email} placeholder="you@example.com" onChange={(email) => setForm((current) => ({ ...current, email }))} />
                  <FormField label="Primary channel URL" type="url" value={form.channelLink1} placeholder="https://instagram.com/..." onChange={(channelLink1) => setForm((current) => ({ ...current, channelLink1 }))} />
                  <FormField label="Second channel URL (optional)" type="url" required={false} value={form.channelLink2} placeholder="https://youtube.com/..." onChange={(channelLink2) => setForm((current) => ({ ...current, channelLink2 }))} />
                  {notice && <div className={`rounded-xl border p-4 text-sm font-semibold ${notice.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{notice.message}</div>}
                  <button disabled={isSubmitting} className="w-full rounded-xl bg-purple-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Submit application'}</button>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-6"><p className="text-xs font-bold uppercase tracking-wide text-purple-600">{label}</p><p className="mt-2 text-xl font-bold text-gray-950">{value}</p></div>; }
function FormField({ label, type, value, placeholder, required = true, onChange }: { label: string; type: 'email' | 'url'; value: string; placeholder: string; required?: boolean; onChange: (value: string) => void }) { return <label className="block space-y-2 text-sm font-bold text-gray-700">{label}<input required={required} type={type} value={value} maxLength={500} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" /></label>; }
