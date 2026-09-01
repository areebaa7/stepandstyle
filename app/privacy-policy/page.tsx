import PolicyPage from '@/app/components/PolicyPage';
import { createPageMetadata } from '@/lib/pageMetadata';

export const metadata = createPageMetadata(
  'Privacy Policy',
  'How Step & Styl collects and uses customer information.',
  '/privacy-policy',
);

export default function PrivacyPolicyPage() {
  return <PolicyPage policyKey="privacyPolicy" showPrivacyContact />;
}
