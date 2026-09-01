'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewArrivalsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to products page with new arrivals filter
    router.push('/products?isNew=true');
  }, [router]);

  return null;
}
