import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Affiliate Offer',
  robots: { index: false, follow: false },
};

export default function PromoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
