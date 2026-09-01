'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_STOREFRONT_SETTINGS } from '@/lib/storefrontSettings';
import type { StorefrontSettingsDTO } from '@/types/storefrontSettings';
import { AdminLoadingState, AdminNotice } from './AdminAsyncState';

export default function AdminConversionPanel() {
  const [settings, setSettings] = useState<StorefrontSettingsDTO>(DEFAULT_STOREFRONT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/storefront', { cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to load conversion settings.');
        setSettings(payload.data);
      } catch (error) {
        setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load conversion settings.' });
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      setMessage(null);
      const response = await fetch('/api/admin/settings/storefront', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualPaymentEnabled: settings.manualPaymentEnabled,
          bankName: settings.bankName,
          bankAccountTitle: settings.bankAccountTitle,
          bankAccountNumber: settings.bankAccountNumber,
          bankIban: settings.bankIban,
          easypaisaAccountTitle: settings.easypaisaAccountTitle,
          easypaisaAccountNumber: settings.easypaisaAccountNumber,
          jazzcashAccountTitle: settings.jazzcashAccountTitle,
          jazzcashAccountNumber: settings.jazzcashAccountNumber,
          manualPaymentInstructions: settings.manualPaymentInstructions,
          bankTransferPopupEnabled: settings.bankTransferPopupEnabled,
          bankTransferDiscountPercent: settings.bankTransferDiscountPercent,
          bankTransferPopupTitle: settings.bankTransferPopupTitle,
          bankTransferPopupMessage: settings.bankTransferPopupMessage,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Failed to save conversion settings.');
      setSettings(payload.data);
      setMessage({ type: 'success', text: 'Checkout payment settings saved.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save conversion settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <AdminLoadingState label="Loading conversion settings..." />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-600">Checkout configuration</p>
        <h2 className="mt-1 text-2xl font-bold text-gray-900">Payment Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Manage the payment destinations and bank-transfer offer shown to customers.</p>
      </div>

      {message && (
        <AdminNotice type={message.type} message={message.text} />
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={saveSettings} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Manual payment destinations</h3>
            <p className="mt-1 text-sm text-gray-500">Empty destinations stay hidden from checkout. At least one complete destination is required before manual payment becomes available.</p>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-emerald-50 p-4">
            <span>
              <span className="block text-sm font-bold text-emerald-950">Enable manual payments</span>
              <span className="mt-1 block text-xs text-emerald-800/70">Allow customers to pay by configured bank or mobile-wallet transfer.</span>
            </span>
            <input
              type="checkbox"
              checked={settings.manualPaymentEnabled}
              onChange={(event) => setSettings({ ...settings, manualPaymentEnabled: event.target.checked })}
              className="h-5 w-5 accent-emerald-600"
            />
          </label>

          <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4">
            <legend className="px-2 text-sm font-bold text-gray-900">Bank account</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <PaymentField label="Bank name" maxLength={100} value={settings.bankName} onChange={(value) => setSettings({ ...settings, bankName: value })} />
              <PaymentField label="Account title" maxLength={100} value={settings.bankAccountTitle} onChange={(value) => setSettings({ ...settings, bankAccountTitle: value })} />
              <PaymentField label="Account number" maxLength={64} value={settings.bankAccountNumber} onChange={(value) => setSettings({ ...settings, bankAccountNumber: value })} />
              <PaymentField label="IBAN" maxLength={64} value={settings.bankIban} onChange={(value) => setSettings({ ...settings, bankIban: value })} />
            </div>
            <p className="text-xs text-gray-500">Bank name plus an account number or IBAN makes this destination visible.</p>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4">
              <legend className="px-2 text-sm font-bold text-gray-900">Easypaisa</legend>
              <PaymentField label="Account title" maxLength={100} value={settings.easypaisaAccountTitle} onChange={(value) => setSettings({ ...settings, easypaisaAccountTitle: value })} />
              <PaymentField label="Account number" maxLength={32} value={settings.easypaisaAccountNumber} onChange={(value) => setSettings({ ...settings, easypaisaAccountNumber: value })} inputMode="tel" />
            </fieldset>

            <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4">
              <legend className="px-2 text-sm font-bold text-gray-900">JazzCash</legend>
              <PaymentField label="Account title" maxLength={100} value={settings.jazzcashAccountTitle} onChange={(value) => setSettings({ ...settings, jazzcashAccountTitle: value })} />
              <PaymentField label="Account number" maxLength={32} value={settings.jazzcashAccountNumber} onChange={(value) => setSettings({ ...settings, jazzcashAccountNumber: value })} inputMode="tel" />
            </fieldset>
          </div>

          <label className="block space-y-2 text-sm font-semibold text-gray-700">
            Customer instructions
            <textarea
              maxLength={500}
              rows={4}
              value={settings.manualPaymentInstructions}
              onChange={(event) => setSettings({ ...settings, manualPaymentInstructions: event.target.value })}
              placeholder="For example: Transfer the final amount and upload a clear payment receipt."
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </label>

          <div className="border-t border-gray-200 pt-5">
            <h3 className="text-lg font-bold text-gray-900">Bank-transfer offer</h3>
            <p className="mt-1 text-sm text-gray-500">Configure the optional checkout-opening incentive.</p>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-purple-50 p-4">
            <span>
              <span className="block text-sm font-bold text-purple-950">Show conversion popup</span>
              <span className="mt-1 block text-xs text-purple-700/70">Display the bank-transfer offer when checkout opens.</span>
            </span>
            <input
              type="checkbox"
              checked={settings.bankTransferPopupEnabled}
              onChange={(event) => setSettings({ ...settings, bankTransferPopupEnabled: event.target.checked })}
              className="h-5 w-5 accent-purple-600"
            />
          </label>

          <label className="block space-y-2 text-sm font-semibold text-gray-700">
            Bank-transfer discount
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.bankTransferDiscountPercent}
                onChange={(event) => setSettings({ ...settings, bankTransferDiscountPercent: Number(event.target.value) })}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">%</span>
            </div>
          </label>

          <label className="block space-y-2 text-sm font-semibold text-gray-700">
            Popup title
            <input
              required
              maxLength={100}
              value={settings.bankTransferPopupTitle}
              onChange={(event) => setSettings({ ...settings, bankTransferPopupTitle: event.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </label>

          <label className="block space-y-2 text-sm font-semibold text-gray-700">
            Popup message
            <textarea
              required
              maxLength={240}
              rows={4}
              value={settings.bankTransferPopupMessage}
              onChange={(event) => setSettings({ ...settings, bankTransferPopupMessage: event.target.value })}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </label>

          <button disabled={isSaving} className="w-full rounded-xl bg-purple-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-50">
            {isSaving ? 'Saving...' : 'Save Payment Settings'}
          </button>
        </form>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-sm font-semibold text-gray-700">Customer preview</p>
          <ManualPaymentPreview settings={settings} />
          <div className={`rounded-2xl border p-7 text-center shadow-xl ${settings.bankTransferPopupEnabled ? 'border-purple-100 bg-white' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-purple-100 text-2xl text-purple-700">%</div>
            <h3 className="text-xl font-bold text-gray-900">{settings.bankTransferPopupTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">{settings.bankTransferPopupMessage}</p>
            <div className="mt-6 space-y-2">
              <div className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-xs font-bold text-white">Continue with Bank Transfer</div>
              <div className="rounded-xl bg-gray-100 px-4 py-3 text-xs font-bold text-gray-600">Continue Checkout</div>
            </div>
            {!settings.bankTransferPopupEnabled && <p className="mt-4 text-xs font-bold text-gray-500">Popup is currently disabled</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentField({
  label,
  value,
  maxLength,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  maxLength: number;
  inputMode?: 'tel';
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-gray-700">
      {label}
      <input
        value={value}
        maxLength={maxLength}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
      />
    </label>
  );
}

function ManualPaymentPreview({ settings }: { settings: StorefrontSettingsDTO }) {
  const bankVisible = Boolean(settings.bankName.trim() && (settings.bankAccountNumber.trim() || settings.bankIban.trim()));
  const easypaisaVisible = Boolean(settings.easypaisaAccountNumber.trim());
  const jazzcashVisible = Boolean(settings.jazzcashAccountNumber.trim());
  const isAvailable = settings.manualPaymentEnabled && (bankVisible || easypaisaVisible || jazzcashVisible);

  return (
    <div className={`mb-5 rounded-2xl border p-5 shadow-sm ${isAvailable ? 'border-emerald-200 bg-white' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-900">Manual payment at checkout</h3>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
          {isAvailable ? 'Visible' : 'Hidden'}
        </span>
      </div>
      {!settings.manualPaymentEnabled && <p className="mt-3 text-xs text-amber-800">Enable manual payments to publish configured destinations.</p>}
      {settings.manualPaymentEnabled && !isAvailable && <p className="mt-3 text-xs text-amber-800">Add a complete bank account or a mobile-wallet number to make this option visible.</p>}
      {isAvailable && (
        <div className="mt-4 space-y-3 text-xs text-gray-600">
          {bankVisible && <PreviewDestination label={settings.bankName} title={settings.bankAccountTitle} values={[settings.bankIban, settings.bankAccountNumber]} />}
          {easypaisaVisible && <PreviewDestination label="Easypaisa" title={settings.easypaisaAccountTitle} values={[settings.easypaisaAccountNumber]} />}
          {jazzcashVisible && <PreviewDestination label="JazzCash" title={settings.jazzcashAccountTitle} values={[settings.jazzcashAccountNumber]} />}
          {settings.manualPaymentInstructions && <p className="rounded-lg bg-gray-50 p-3 leading-5">{settings.manualPaymentInstructions}</p>}
        </div>
      )}
    </div>
  );
}

function PreviewDestination({ label, title, values }: { label: string; title: string; values: string[] }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <p className="font-bold text-gray-900">{label}</p>
      {title && <p>{title}</p>}
      {values.filter(Boolean).map((value) => <p key={value} className="break-all font-mono">{value}</p>)}
    </div>
  );
}
