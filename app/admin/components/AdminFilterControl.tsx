'use client';

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500';
const controlClass = 'h-11 w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-800 outline-none transition hover:border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-100';

export function AdminFilterSearch({
  label = 'Search',
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className={className}>
      <span className={labelClass}>{label}</span>
      <span className="relative block">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input {...props} type="search" className={`${controlClass} pl-10 pr-4`} />
      </span>
    </label>
  );
}

export function AdminFilterSelect({
  label,
  children,
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className={className}>
      <span className={labelClass}>{label}</span>
      <span className="relative block">
        <select {...props} data-custom-chevron="true" className={`${controlClass} appearance-none pl-3.5 pr-10`}>
          {children}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </span>
    </label>
  );
}
