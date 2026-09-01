import type { Metadata } from 'next';

export function createPageMetadata(
  title: string,
  description: string,
  canonical: string,
  index = true,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index, follow: index },
    openGraph: { title, description, url: canonical },
    twitter: { title, description },
  };
}
