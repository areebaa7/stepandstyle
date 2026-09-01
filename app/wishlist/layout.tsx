import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Your Wishlist',
  'Review the Step & Styl products saved to your wishlist.',
  '/wishlist',
  false,
);

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
