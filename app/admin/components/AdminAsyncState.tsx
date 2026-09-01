import type { ReactNode } from 'react';

type Action = {
  label: string;
  onClick?: () => void;
  href?: string;
};

function StateAction({ action }: { action?: Action }) {
  if (!action) return null;

  const className =
    'mt-5 inline-flex rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2';

  if (action.href) {
    return (
      <a href={action.href} className={className}>
        {action.label}
      </a>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
}

export function AdminLoadingState({ label = 'Loading data...' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-admin-state="loading"
      className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm"
    >
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />
      <p className="mt-4 text-sm font-semibold text-gray-600">{label}</p>
    </div>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description?: string;
  action?: Action;
  compact?: boolean;
}) {
  return (
    <div
      data-admin-state="empty"
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/70 px-6 text-center ${
        compact ? 'py-8' : 'min-h-48 py-12'
      }`}
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-black text-purple-500 shadow-sm">
        +
      </span>
      <h3 className="mt-4 text-base font-bold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500">{description}</p>
      )}
      <StateAction action={action} />
    </div>
  );
}

export function AdminErrorState({
  title = 'Unable to load this section',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      data-admin-state="error"
      className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center"
    >
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-black text-red-600 shadow-sm">
        !
      </span>
      <h3 className="mt-4 text-base font-bold text-red-950">{title}</h3>
      <p className="mt-1 max-w-xl text-sm leading-6 text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function AdminNotice({
  type,
  message,
  action,
}: {
  type: 'success' | 'error' | 'info';
  message: ReactNode;
  action?: ReactNode;
}) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
  }[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      data-admin-notice={type}
      className={`flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm font-semibold sm:flex-row sm:items-center sm:justify-between ${styles}`}
    >
      <span>{message}</span>
      {action}
    </div>
  );
}
