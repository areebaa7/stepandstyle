import type { Metadata } from 'next';
import prisma from '@/lib/prisma';

type BlogLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

async function getPublishedBlog(slug: string) {
  return prisma.blog.findFirst({ where: { slug, isPublished: true } });
}

export async function generateMetadata({ params }: BlogLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getPublishedBlog(slug);

  if (!blog) {
    return { title: 'Blog Not Found', robots: { index: false, follow: false } };
  }

  return {
    title: blog.title,
    description: blog.description,
    alternates: { canonical: `/blogs/${blog.slug}` },
    openGraph: {
      type: 'article',
      url: `/blogs/${blog.slug}`,
      title: blog.title,
      description: blog.description,
      publishedTime: blog.createdAt.toISOString(),
      modifiedTime: blog.updatedAt.toISOString(),
      images: blog.image ? [{ url: blog.image, alt: blog.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.description,
      images: blog.image ? [blog.image] : undefined,
    },
  };
}

export default async function BlogLayout({ children, params }: BlogLayoutProps) {
  const { slug } = await params;
  const blog = await getPublishedBlog(slug);
  const structuredData = blog ? {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.description,
    image: blog.image || undefined,
    datePublished: blog.createdAt.toISOString(),
    dateModified: blog.updatedAt.toISOString(),
    author: { '@type': 'Person', name: blog.author || 'Step & Styl' },
    publisher: { '@type': 'Organization', name: 'Step & Styl' },
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
