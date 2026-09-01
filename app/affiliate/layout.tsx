import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Affiliate Program',
  'Join the Step & Styl affiliate program and earn by recommending footwear you love.',
  '/affiliate',
);

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
