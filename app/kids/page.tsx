'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function KidsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to products page with kids gender filter
    router.push('/products?gender=KIDS');
  }, [router]);

  return null;
}
