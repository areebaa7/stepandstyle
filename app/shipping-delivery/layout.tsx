import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Shipping & Delivery',
  'Review Step & Styl shipping options, delivery charges and estimated delivery times.',
  '/shipping-delivery',
);

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
