import PolicyPage from '@/app/components/PolicyPage';
import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Terms & Conditions',
  'The terms that apply when using Step & Styl and placing an order.',
  '/terms-and-conditions',
);

export default function TermsAndConditionsPage() {
  return <PolicyPage policyKey="termsPolicy" />;
}
