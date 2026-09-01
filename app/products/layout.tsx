import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Shop Premium Footwear',
  'Shop Step & Styl footwear for women, men and kids, including heels, slippers and everyday styles.',
  '/products',
);

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
