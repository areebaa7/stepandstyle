import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Help Center',
  'Find answers and get support for Step & Styl products, orders, delivery and returns.',
  '/help-center',
);

export default function HelpCenterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
