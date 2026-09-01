import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Step & Styl customer email verification result.',
  robots: { index: false, follow: false },
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
