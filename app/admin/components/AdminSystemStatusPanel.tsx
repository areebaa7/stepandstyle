'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AdminErrorState, AdminLoadingState } from './AdminAsyncState';

type StatusData = {
  mode: 'PROVIDERLESS_TESTING' | 'PARTIALLY_CONFIGURED';
  smtp: {
    status: 'CONFIGURED' | 'CREDENTIALS_MISSING' | 'DISABLED';
    configured: boolean;
    deliveryEnabled: boolean;
    credentialsPresent: boolean;
    missing: string[];
    affectedFeatures: string[];
  };
  marketing: {
    status: 'NOT_SELECTED' | 'CONFIGURED' | 'CREDENTIALS_MISSING';
    selectedProvider: 'NONE' | 'MAILCHIMP' | 'BREVO' | 'KLAVIYO';
    configured: boolean;
    localSubscriberStorageOperational: boolean;
    missing: string[];
  };
  cron: {
    status: 'OPERATIONAL' | 'INACTIVE';
    operational: boolean;
    endpointProtected: boolean;
    schedulerConfigured: boolean;
    emailDeliveryReady: boolean;
    delayHours: number;
    missing: string[];
  };
  pendingDocumentation: {
    file: string;
    reason: string;
  };
  generatedAt: string;
};

type StatusCardProps = {
  title: string;
  description: string;
  ready: boolean;
  readyLabel: string;
  pendingLabel: string;
  missing: string[];
  children?: ReactNode;
};

function StatusCard({
  title,
  description,
  ready,
  readyLabel,
  pendingLabel,
  missing,
  children,
}: StatusCardProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            ready
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {ready ? readyLabel : pendingLabel}
        </span>
      </div>

      {children}

      {missing.length > 0 && (
        <div className="mt-5 rounded-xl bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
            Required before activation
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {missing.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ReadinessRow({
  label,
  ready,
}: {
  label: string;
  ready: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-2.5 last:border-b-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`text-xs font-bold ${
          ready ? 'text-emerald-700' : 'text-amber-700'
        }`}
      >
        {ready ? 'Ready' : 'Pending'}
      </span>
    </div>
  );
}

export default function AdminSystemStatusPanel() {
  const [data, setData] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/admin/system-status', {
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load system status.');
      }
      setData(payload.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load system status.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // The first readiness check intentionally owns this panel's initial state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStatus();
  }, [loadStatus]);

  if (isLoading) {
    return <AdminLoadingState label="Checking email and automation status..." />;
  }

  if (error || !data) {
    return (
      <AdminErrorState
        message={error || 'Status data is unavailable.'}
        onRetry={() => void loadStatus()}
      />
    );
  }

  const providerLabel =
    data.marketing.selectedProvider === 'NONE'
      ? 'None selected'
      : data.marketing.selectedProvider;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-950">
            Email & Cron Status
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
            Read-only readiness checks for outbound email, customer marketing,
            and abandoned-cart automation. Secret values are never shown here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadStatus()}
          className="shrink-0 rounded-xl border border-purple-200 px-4 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-50"
        >
          Refresh status
        </button>
      </div>

      {data.mode === 'PROVIDERLESS_TESTING' && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <p className="font-bold text-blue-950">Providerless testing mode</p>
          <p className="mt-1 text-sm leading-6 text-blue-900">
            No email service provider or SMTP account is configured. The site
            can be tested and newsletter contacts can still be stored locally,
            but no real email will be sent.
          </p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <StatusCard
          title="Transactional SMTP"
          description="Used by verification, password reset, order, affiliate, marketing, and recovery messages."
          ready={data.smtp.configured}
          readyLabel="Configured"
          pendingLabel={
            data.smtp.deliveryEnabled ? 'Credentials missing' : 'Disabled for testing'
          }
          missing={data.smtp.missing}
        >
          <div className="mt-4">
            <ReadinessRow
              label="Delivery explicitly enabled"
              ready={data.smtp.deliveryEnabled}
            />
            <ReadinessRow
              label="SMTP values present"
              ready={data.smtp.credentialsPresent}
            />
            <ReadinessRow
              label="Outbound email delivery"
              ready={data.smtp.configured}
            />
          </div>
        </StatusCard>

        <StatusCard
          title="Email marketing"
          description={`Selected provider: ${providerLabel}. Contact consent and local subscriber storage do not require a provider.`}
          ready={data.marketing.configured}
          readyLabel="Configured"
          pendingLabel={
            data.marketing.selectedProvider === 'NONE'
              ? 'Provider not selected'
              : 'Credentials missing'
          }
          missing={data.marketing.missing}
        >
          <div className="mt-4">
            <ReadinessRow
              label="Local subscriber storage"
              ready={data.marketing.localSubscriberStorageOperational}
            />
            <ReadinessRow
              label="External provider sync"
              ready={data.marketing.configured}
            />
          </div>
        </StatusCard>

        <StatusCard
          title="Abandoned-cart cron"
          description={`Recovery is scheduled after ${data.cron.delayHours} hour${data.cron.delayHours === 1 ? '' : 's'} once every dependency is active.`}
          ready={data.cron.operational}
          readyLabel="Operational"
          pendingLabel="Inactive"
          missing={data.cron.missing}
        >
          <div className="mt-4">
            <ReadinessRow
              label="Protected cron endpoint"
              ready={data.cron.endpointProtected}
            />
            <ReadinessRow
              label="Production scheduler"
              ready={data.cron.schedulerConfigured}
            />
            <ReadinessRow
              label="Email delivery dependency"
              ready={data.cron.emailDeliveryReady}
            />
          </div>
        </StatusCard>
      </div>

      {!data.smtp.configured && (
        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <h3 className="font-bold text-gray-950">
            Features waiting for an email provider
          </h3>
          <ul className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
            {data.smtp.affectedFeatures.map((feature) => (
              <li key={feature}>• {feature}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
        <p className="font-bold text-purple-950">Pending setup is documented</p>
        <p className="mt-1 text-sm leading-6 text-purple-900">
          {data.pendingDocumentation.reason} The project pending-work document
          records the exact requirements and activation order.
        </p>
      </section>

      <p className="text-xs text-gray-400">
        Last checked: {new Date(data.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}
