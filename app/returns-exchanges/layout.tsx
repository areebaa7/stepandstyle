import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Returns & Exchanges',
  'Learn how to request a return or exchange for an eligible Step & Styl order.',
  '/returns-exchanges',
);

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
