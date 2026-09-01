import type { Metadata } from 'next';
import prisma from '@/lib/prisma';

type ProductLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

const productImages = (image: string | null, images: unknown) => {
  const gallery = Array.isArray(images)
    ? images.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
    : [];
  return Array.from(new Set([image, ...gallery].filter((entry): entry is string => Boolean(entry))));
};

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { reviews: { where: { status: 'APPROVED' } } },
      },
    },
  });
}

export async function generateMetadata({ params }: ProductLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: 'Product Not Found', robots: { index: false, follow: false } };

  const images = productImages(product.image, product.images);
  return {
    title: product.title,
    description: product.shortDescription || product.description.slice(0, 160),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: 'website',
      url: `/products/${product.slug}`,
      title: product.title,
      description: product.shortDescription,
      images: images.map((url) => ({ url, alt: product.title })),
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.shortDescription,
      images: images.slice(0, 1),
    },
  };
}

export default async function ProductLayout({ children, params }: ProductLayoutProps) {
  const { id } = await params;
  const product = await getProduct(id);
  const images = product ? productImages(product.image, product.images) : [];
  const finalPrice = product
    ? product.price * (1 - Number(product.discount || 0) / 100)
    : 0;
  const structuredData = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    title: product.title,
    description: product.description,
    image: images,
    sku: product.slug,
    brand: { '@type': 'Brand', name: 'Step & Styl' },
    aggregateRating: product.rating > 0 && product._count.reviews > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product._count.reviews,
    } : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      price: finalPrice.toFixed(2),
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.stepandstyl.com'}/products/${product.slug}`,
    },
  } : null;

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
        />
      )}
      {children}
    </>
  );
}
