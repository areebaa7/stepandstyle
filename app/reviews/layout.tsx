import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Customer Reviews',
  'Read verified customer experiences with Step & Styl footwear and service.',
  '/reviews',
);

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
