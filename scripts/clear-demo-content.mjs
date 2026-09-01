import { PrismaClient } from '@prisma/client';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const DEMO_REVIEW_EMAILS = ['demo-review@stepandstyle.test', 'reviews@stepandstyl.com'];
const DEMO_SALE_NAMES = ['[DEMO] Seasonal Preview Sale', 'Seasonal Sale'];
const SEEDED_SLUGS = [
  'bridal-edit', 'women-essentials', 'men-formal', 'kids-play', 'everyday-comfort',
  'statement-heels', 'women-flats', 'women-sandals', 'executive-formal', 'men-casual',
  'men-sandals', 'kids-school', 'kids-party', 'home-comfort',
  'royal-ivory-bridal-heels', 'midnight-party-heels', 'cloud-soft-ballet-flats',
  'sunlit-cross-strap-sandals', 'lilac-daily-wear-flats', 'rose-gold-event-shoes',
  'signature-leather-loafers', 'petal-play-kids-sandals', 'pearl-knot-mules',
  'classic-nude-pumps', 'embroidered-festive-flats', 'bow-detail-comfort-flats',
  'minimal-buckle-sandals', 'velvet-bridal-mules', 'executive-cap-toe-oxfords',
  'city-derby-shoes', 'black-tassel-loafers', 'weekend-slip-ons',
  'heritage-peshawari-sandals', 'urban-lace-up-sneakers', 'men-comfort-slides',
  'school-day-velcro-shoes', 'rainbow-play-sandals', 'junior-party-flats',
  'mini-adventure-sandals', 'star-light-slip-ons', 'glitter-occasion-sandals',
  'cozy-home-slippers', 'easy-pool-slides',
  'how-to-care-for-everyday-shoes', 'find-your-comfortable-shoe-size',
  'five-footwear-styles-for-a-versatile-wardrobe', 'occasion-shoes-without-the-discomfort',
  'kids-footwear-fit-checklist', 'build-a-smart-workweek-shoe-rotation',
];
const DEMO_BANNER_TITLES = [
  '[DEMO] Every Step, Styled',
  '[DEMO] Occasion Ready',
  '[DEMO] Modern Classics',
  '[DEMO] The Women’s Edit',
  '[DEMO] Smart Foundations',
  '[DEMO] Little Steps, Big Days',
  '[DEMO] Preview Sale',
  'Every Step, Styled',
  'Occasion Ready',
  'Modern Classics',
  "The Women's Edit",
  'Smart Foundations',
  'Little Steps, Big Days',
  'Seasonal Sale',
];
const DEMO_REEL_TITLES = [
  '[DEMO] Formal Loafer Close-Up',
  '[DEMO] Midnight Style in Motion',
  '[DEMO] Occasion Edit Preview',
  '[DEMO] Everyday Comfort Detail',
  'Formal Loafer Close-Up',
  'Midnight Style in Motion',
  'Occasion Edit',
  'Everyday Comfort Detail',
];

async function clearDemoContent() {
  const demoProducts = await prisma.product.findMany({
    where: { OR: [{ slug: { startsWith: 'demo-' } }, { slug: { in: SEEDED_SLUGS } }] },
    select: { id: true },
  });
  const demoProductIds = demoProducts.map((product) => product.id);

  const removed = {};
  removed.sales = (await prisma.saleEvent.deleteMany({ where: { name: { in: DEMO_SALE_NAMES } } })).count;
  removed.banners = (await prisma.banner.deleteMany({ where: { title: { in: DEMO_BANNER_TITLES } } })).count;
  removed.blogs = (await prisma.blog.deleteMany({ where: { OR: [{ slug: { startsWith: 'demo-' } }, { slug: { in: SEEDED_SLUGS } }] } })).count;
  removed.reels = (await prisma.homeReel.deleteMany({ where: { title: { in: DEMO_REEL_TITLES } } })).count;
  removed.reviews = (
    await prisma.review.deleteMany({
      where: {
        OR: [
          { userEmail: { in: DEMO_REVIEW_EMAILS } },
          ...(demoProductIds.length ? [{ productId: { in: demoProductIds } }] : []),
        ],
      },
    })
  ).count;
  removed.products = (await prisma.product.deleteMany({ where: { OR: [{ slug: { startsWith: 'demo-' } }, { slug: { in: SEEDED_SLUGS } }] } })).count;
  removed.collections = (await prisma.collection.deleteMany({ where: { OR: [{ slug: { startsWith: 'demo-' } }, { slug: { in: SEEDED_SLUGS } }] } })).count;

  console.log('Demo storefront content removed. Non-demo records were preserved.');
  console.log(JSON.stringify(removed, null, 2));
}

clearDemoContent()
  .catch((error) => {
    console.error('Demo cleanup failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
