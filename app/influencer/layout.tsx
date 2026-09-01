import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Influencer Dashboard',
  robots: { index: false, follow: false },
};

export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
