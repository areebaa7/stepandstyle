import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Our Story',
  'Learn about Step & Styl, our approach to footwear and our focus on comfort and style.',
  '/our-story',
);

export default function OurStoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
