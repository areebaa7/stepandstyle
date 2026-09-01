import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Style Journal',
  'Read footwear styling advice, product guides and the latest stories from Step & Styl.',
  '/blogs',
);

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
