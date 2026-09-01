'use client';

import Link from 'next/link';
import { useBusinessContactSettings } from '@/app/context/BusinessContactContext';

export default function PrivacyContact() {
  const settings = useBusinessContactSettings();

  if (settings.supportEmail) {
    return (
      <p className="mt-2">
        For privacy requests or questions, email{' '}
        <a className="font-semibold text-purple-700 underline" href={`mailto:${settings.supportEmail}`}>
          {settings.supportEmail}
        </a>.
      </p>
    );
  }

  return (
    <p className="mt-2">
      For privacy requests or questions, use the current contact details in our{' '}
      <Link className="font-semibold text-purple-700 underline" href="/help-center">Help Center</Link>.
    </p>
  );
}
