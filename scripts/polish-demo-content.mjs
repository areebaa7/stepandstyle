import { PrismaClient } from '@prisma/client';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const collectionNames = new Map([
  ['demo-bridal-edit', 'Bridal Edit'],
  ['demo-women-essentials', 'Women Essentials'],
  ['demo-men-formal', 'Men Formal'],
  ['demo-kids-play', 'Kids Play'],
  ['demo-everyday-comfort', 'Everyday Comfort'],
  ['demo-statement-heels', 'Statement Heels'],
  ['demo-women-flats', 'Women Flats'],
  ['demo-women-sandals', 'Women Sandals'],
  ['demo-executive-formal', 'Executive Formal'],
  ['demo-men-casual', 'Men Casual'],
  ['demo-men-sandals', 'Men Sandals'],
  ['demo-kids-school', 'Kids School'],
  ['demo-kids-party', 'Kids Party'],
  ['demo-home-comfort', 'Home Comfort'],
]);

const bannerPresentation = new Map([
  ['[DEMO] Every Step, Styled', { title: 'Every Step, Styled', subtitle: 'A complete collection for workdays, celebrations and little adventures.', ctaText: 'Explore Collection' }],
  ['[DEMO] Occasion Ready', { title: 'Occasion Ready' }],
  ['[DEMO] Modern Classics', { title: 'Modern Classics' }],
  ['[DEMO] The Women’s Edit', { title: "The Women's Edit" }],
  ['[DEMO] The Womenâ€™s Edit', { title: "The Women's Edit" }],
  ['[DEMO] Smart Foundations', { title: 'Smart Foundations' }],
  ['[DEMO] Little Steps, Big Days', { title: 'Little Steps, Big Days' }],
  ['[DEMO] Preview Sale', { title: 'Seasonal Sale', subtitle: 'Save up to 16% across selected styles.' }],
]);

const reelPresentation = new Map([
  ['[DEMO] Formal Loafer Close-Up', { title: 'Formal Loafer Close-Up' }],
  ['[DEMO] Midnight Style in Motion', { title: 'Midnight Style in Motion' }],
  ['[DEMO] Occasion Edit Preview', { title: 'Occasion Edit', caption: 'A quick campaign look at the latest collection.' }],
  ['[DEMO] Everyday Comfort Detail', { title: 'Everyday Comfort Detail' }],
]);

function polishString(value) {
  return value
    .replaceAll('/products/demo-', '/products/')
    .replaceAll('/demo/', '/catalog/')
    .replace(/^demo-/, '')
    .replace(/^Demo collection$/i, 'Curated collection')
    .replace(/\bfull demo storefront\b/gi, 'latest collection')
    .replace(/\bThis demo guide is general care information\./gi, 'This guide provides general care information.')
    .replace(/\bfinal product\b/gi, 'product')
    .replace(/Sizes in this testing catalog are sample data and must be replaced with final supplier measurements before launch\./gi, "Use each product's size and fit guidance before placing your order.");
}

function polishJson(value) {
  if (typeof value === 'string') return polishString(value);
  if (Array.isArray(value)) return value.map(polishJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, polishJson(entry)]));
  }
  return value;
}

function collectStrings(value, output) {
  if (typeof value === 'string') {
    output.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectStrings(entry, output));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectStrings(entry, output));
  }
}

async function assertSlugAvailable(model, id, slug) {
  const existing = await model.findUnique({ where: { slug }, select: { id: true } });
  if (existing && existing.id !== id) throw new Error(`Cannot rename seeded record to occupied slug: ${slug}`);
}

async function polishContent() {
  const collections = await prisma.collection.findMany({ where: { slug: { startsWith: 'demo-' } } });
  for (const collection of collections) {
    const slug = collection.slug.replace(/^demo-/, '');
    await assertSlugAvailable(prisma.collection, collection.id, slug);
    await prisma.collection.update({
      where: { id: collection.id },
      data: {
        slug,
        name: collectionNames.get(collection.slug) || collection.name.replace(/^Demo\s+/i, ''),
        image: collection.image ? polishString(collection.image) : null,
      },
    });
  }

  const products = await prisma.product.findMany({ where: { slug: { startsWith: 'demo-' } } });
  for (const product of products) {
    const slug = product.slug.replace(/^demo-/, '');
    await assertSlugAvailable(prisma.product, product.id, slug);
    await prisma.product.update({
      where: { id: product.id },
      data: {
        slug,
        image: product.image ? polishString(product.image) : null,
        images: polishJson(product.images),
        videoUrl: product.videoUrl ? polishString(product.videoUrl) : null,
        features: polishJson(product.features),
        variants: polishJson(product.variants),
      },
    });
  }

  const blogs = await prisma.blog.findMany({ where: { slug: { startsWith: 'demo-' } } });
  for (const blog of blogs) {
    const slug = blog.slug.replace(/^demo-/, '');
    await assertSlugAvailable(prisma.blog, blog.id, slug);
    await prisma.blog.update({
      where: { id: blog.id },
      data: {
        slug,
        description: polishString(blog.description),
        content: polishString(blog.content),
        image: blog.image ? polishString(blog.image) : null,
        images: polishJson(blog.images),
        videoUrl: blog.videoUrl ? polishString(blog.videoUrl) : null,
      },
    });
  }

  const banners = await prisma.banner.findMany();
  for (const banner of banners) {
    const presentation = banner.title ? bannerPresentation.get(banner.title) : null;
    const containsDemo = [banner.title, banner.subtitle, banner.ctaText, banner.desktopImageUrl, banner.mobileImageUrl]
      .some((value) => typeof value === 'string' && /\bdemo\b/i.test(value));
    if (!presentation && !containsDemo) continue;
    await prisma.banner.update({
      where: { id: banner.id },
      data: {
        title: presentation?.title || (banner.title ? polishString(banner.title).replace(/^\[DEMO\]\s*/i, '') : null),
        subtitle: presentation?.subtitle || (banner.subtitle ? polishString(banner.subtitle) : null),
        ctaText: presentation?.ctaText || (banner.ctaText ? polishString(banner.ctaText) : null),
        desktopImageUrl: polishString(banner.desktopImageUrl),
        mobileImageUrl: polishString(banner.mobileImageUrl),
      },
    });
  }

  const reels = await prisma.homeReel.findMany();
  for (const reel of reels) {
    const presentation = reelPresentation.get(reel.title);
    const containsDemo = [reel.title, reel.caption, reel.posterUrl, reel.productLink]
      .some((value) => typeof value === 'string' && /\bdemo\b/i.test(value));
    if (!presentation && !containsDemo) continue;
    await prisma.homeReel.update({
      where: { id: reel.id },
      data: {
        title: presentation?.title || polishString(reel.title).replace(/^\[DEMO\]\s*/i, ''),
        caption: presentation?.caption || (reel.caption ? polishString(reel.caption) : null),
        posterUrl: reel.posterUrl ? polishString(reel.posterUrl) : null,
        productLink: reel.productLink ? polishString(reel.productLink) : null,
      },
    });
  }

  const legacySale = await prisma.saleEvent.findUnique({ where: { name: '[DEMO] Seasonal Preview Sale' } });
  if (legacySale) {
    const existingSale = await prisma.saleEvent.findUnique({ where: { name: 'Seasonal Sale' }, select: { id: true } });
    if (existingSale && existingSale.id !== legacySale.id) throw new Error('Cannot rename seeded sale because Seasonal Sale already exists.');
    await prisma.saleEvent.update({
      where: { id: legacySale.id },
      data: { name: 'Seasonal Sale', bannerText: 'UP TO 16% OFF SELECTED STYLES' },
    });
  }

  const seededProductIds = (await prisma.product.findMany({
    where: { slug: { in: products.map((product) => product.slug.replace(/^demo-/, '')) } },
    select: { id: true },
  })).map((product) => product.id);
  const reviews = await prisma.review.findMany({
    where: { OR: [{ userEmail: 'demo-review@stepandstyle.test' }, { productId: { in: seededProductIds } }] },
    select: { id: true, userEmail: true, images: true },
  });
  for (const review of reviews) {
    await prisma.review.update({
      where: { id: review.id },
      data: {
        userEmail: review.userEmail === 'demo-review@stepandstyle.test' ? 'reviews@stepandstyl.com' : review.userEmail,
        images: polishJson(review.images),
      },
    });
  }

  const presentationRecords = await Promise.all([
    prisma.collection.findMany(),
    prisma.product.findMany(),
    prisma.blog.findMany(),
    prisma.banner.findMany(),
    prisma.homeReel.findMany(),
    prisma.saleEvent.findMany(),
    prisma.review.findMany(),
  ]);
  const presentationStrings = [];
  presentationRecords.forEach((records) => collectStrings(records, presentationStrings));
  const remainingDemoValues = presentationStrings.filter((value) => /\bdemo\b/i.test(value));
  if (remainingDemoValues.length > 0) {
    throw new Error(`Visible demo wording remains in ${remainingDemoValues.length} database value(s).`);
  }

  console.log(JSON.stringify({
    collections: collections.length,
    products: products.length,
    blogs: blogs.length,
    reviews: reviews.length,
    remainingDemoValues: remainingDemoValues.length,
  }));
}

polishContent()
  .catch((error) => {
    console.error('Catalog presentation update failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
