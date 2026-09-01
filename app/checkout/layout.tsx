import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Secure Checkout',
  'Complete your Step & Styl order securely.',
  '/checkout',
  false,
);

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
