import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'New Arrivals',
  'Discover the newest footwear arrivals from Step & Styl.',
  '/new-arrivals',
);

export default function NewArrivalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
