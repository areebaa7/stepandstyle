import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your Step & Styl profile, addresses, security and orders.',
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
