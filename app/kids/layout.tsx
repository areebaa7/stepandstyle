import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Kids Footwear',
  'Shop comfortable and stylish Step & Styl footwear for kids.',
  '/kids',
);

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
