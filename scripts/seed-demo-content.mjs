import { PrismaClient } from '@prisma/client';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const DEMO_REVIEW_EMAIL = 'reviews@stepandstyl.com';
const SEEDED_SALE_NAME = 'Seasonal Sale';
const LEGACY_DEMO_SALE_NAME = '[DEMO] Seasonal Preview Sale';

const collectionSeeds = [
  { key: 'bridal', name: 'Bridal Edit', slug: 'bridal-edit', description: 'Pearl details, soft metallics and comfortable occasion heels for the complete bridal wardrobe.', image: '/collections/bridal.jpg', targetGender: 'WOMEN' },
  { key: 'women', name: 'Women Essentials', slug: 'women-essentials', description: 'Versatile heels, flats and sandals designed for workdays, dinners and celebrations.', image: '/collections/heels.jpeg', targetGender: 'WOMEN' },
  { key: 'men', name: 'Men Formal', slug: 'men-formal', description: 'Polished formal footwear with cushioned construction for long working days and special events.', image: '/collections/men.webp', targetGender: 'MEN' },
  { key: 'kids', name: 'Kids Play', slug: 'kids-play', description: 'Secure, lightweight and colourful pairs made for active little feet.', image: '/collections/kids.webp', targetGender: 'KIDS' },
  { key: 'everyday', name: 'Everyday Comfort', slug: 'everyday-comfort', description: 'Easy flats and relaxed sandals for errands, travel and effortless everyday styling.', image: '/collections/flats.jpeg', targetGender: 'UNISEX' },
  { key: 'women_heels', name: 'Statement Heels', slug: 'statement-heels', description: 'Walkable heels for celebrations, dinners and polished evening looks.', image: '/collections/heels.jpeg', targetGender: 'WOMEN' },
  { key: 'women_flats', name: 'Women Flats', slug: 'women-flats', description: 'Soft everyday flats, festive mules and easy slip-on silhouettes.', image: '/collections/flats.jpeg', targetGender: 'WOMEN' },
  { key: 'women_sandals', name: 'Women Sandals', slug: 'women-sandals', description: 'Minimal straps and supportive soles for warm-weather dressing.', image: '/collections/sandals.jpg', targetGender: 'WOMEN' },
  { key: 'men_formal', name: 'Executive Formal', slug: 'executive-formal', description: 'Oxfords, derbies and loafers made for office and occasion wardrobes.', image: '/collections/formal.webp', targetGender: 'MEN' },
  { key: 'men_casual', name: 'Men Casual', slug: 'men-casual', description: 'Relaxed sneakers and slip-ons for weekends and everyday movement.', image: '/collections/picture1.webp', targetGender: 'MEN' },
  { key: 'men_sandals', name: 'Men Sandals', slug: 'men-sandals', description: 'Traditional and modern open footwear with dependable comfort.', image: '/collections/picture2.webp', targetGender: 'MEN' },
  { key: 'kids_school', name: 'Kids School', slug: 'kids-school', description: 'Secure school-day shoes with flexible, easy-clean construction.', image: '/collections/kids.webp', targetGender: 'KIDS' },
  { key: 'kids_party', name: 'Kids Party', slug: 'kids-party', description: 'Cheerful occasion shoes sized for growing feet.', image: '/catalog/products/bow-flat-main.jpeg', targetGender: 'KIDS' },
  { key: 'slippers', name: 'Home Comfort', slug: 'home-comfort', description: 'Soft slippers and easy slides for relaxed days at home.', image: '/collections/picture2.webp', targetGender: 'UNISEX' },
];

function variants(colors, sizes, imageUrl, stockSeed = 7) {
  return colors.flatMap((color, colorIndex) =>
    sizes.map((size, sizeIndex) => ({
      id: `catalog-${color.toLowerCase().replaceAll(' ', '-')}-${size}`,
      color,
      size: String(size),
      stock: Math.max(0, stockSeed - colorIndex - (sizeIndex % 3)),
      imageUrl,
      images: [imageUrl],
    })),
  );
}

function catalogProduct({
  slug, name, collectionKey, description, price, image, images = [image], colors,
  sizes, rating, saleCount, discount = 0, stockSeed = 8, material = 'Premium synthetic upper',
}) {
  const originalPrice = discount > 0 ? Math.round((price / (1 - discount / 100)) / 10) * 10 : null;
  return {
    slug,
    name,
    collectionKey,
    description,
    shortDescription: description.split('.').slice(0, 1).join('.'),
    price,
    originalPrice,
    discount,
    image,
    images,
    advantages: ['Cushioned comfort', 'Dependable grip', 'Easy everyday styling', 'Carefully finished details'],
    specifications: { Material: material, Sole: 'Textured TPR', Fit: 'Regular', Care: 'Wipe clean' },
    features: ['Curated collection', 'Comfort footbed', 'Versatile profile'],
    variants: variants(colors, sizes, image, stockSeed),
    rating,
    saleCount,
  };
}

const productSeeds = [
  {
    slug: 'royal-ivory-bridal-heels', name: 'Royal Ivory Bridal Heels', collectionKey: 'bridal',
    description: 'A graceful ivory occasion heel finished with delicate embellishment and a stable block heel. The cushioned footbed is designed to keep wedding-day looks elegant without giving up comfort.',
    shortDescription: 'Embellished ivory block heels with a cushioned occasion-ready fit.', price: 4890, originalPrice: 5790, discount: 16,
    image: '/catalog/products/bridal-ivory-main.jpeg', images: ['/catalog/products/bridal-ivory-main.jpeg', '/catalog/products/bridal-ivory-detail-1.jpeg', '/catalog/products/bridal-ivory-detail-2.jpeg', '/catalog/products/bridal-ivory-detail-3.jpeg'],
    advantages: ['Stable block heel', 'Cushioned insole', 'Secure ankle fit', 'Celebration-ready finish'],
    specifications: { Material: 'Premium synthetic upper', Heel: '3 inches', Sole: 'Anti-slip TPR', Fit: 'True to size' },
    features: ['Bridal edit', 'Soft inner lining', 'Hand-finished details'],
    variants: variants(['Ivory', 'Champagne'], [36, 37, 38, 39, 40, 41], '/catalog/products/bridal-ivory-main.jpeg', 8), rating: 4.9, saleCount: 48,
  },
  {
    slug: 'midnight-party-heels', name: 'Midnight Party Heels', collectionKey: 'women',
    description: 'A sleek statement heel for dinners, wedding events and evening celebrations. Its balanced profile and padded lining make it easy to style from formal eastern wear to contemporary outfits.',
    shortDescription: 'Sleek evening heels with a supportive fit and polished finish.', price: 4190, originalPrice: 4990, discount: 16,
    image: '/catalog/products/women-heel-main.jpeg', images: ['/catalog/products/women-heel-main.jpeg', '/catalog/products/women-heel-detail-1.jpeg', '/catalog/products/women-heel-detail-2.jpeg'],
    advantages: ['Padded lining', 'Balanced heel profile', 'Secure grip sole', 'Easy evening styling'],
    specifications: { Material: 'Textured synthetic leather', Heel: '3.5 inches', Toe: 'Almond', Occasion: 'Evening' },
    features: ['Party wear', 'Cushioned support', 'Polished hardware'],
    variants: variants(['Black', 'Maroon'], [36, 37, 38, 39, 40, 41], '/catalog/products/women-heel-main.jpeg', 6), rating: 4.7, saleCount: 39,
  },
  {
    slug: 'cloud-soft-ballet-flats', name: 'Cloud Soft Ballet Flats', collectionKey: 'everyday',
    description: 'An easy slip-on flat with a flexible sole and softly padded footbed. The clean silhouette works with office separates, denim and everyday eastern outfits.',
    shortDescription: 'Flexible everyday ballet flats with soft step-in cushioning.', price: 2490, originalPrice: 2890, discount: 14,
    image: '/catalog/products/women-flat-main.jpeg', images: ['/catalog/products/women-flat-main.jpeg', '/catalog/products/women-flat-detail-1.jpeg', '/catalog/products/women-flat-detail-2.jpeg'],
    advantages: ['Flexible sole', 'Lightweight feel', 'Soft footbed', 'Easy slip-on design'],
    specifications: { Material: 'Soft-touch synthetic', Heel: 'Flat', Sole: 'Flexible rubber', Fit: 'Regular' },
    features: ['Workday essential', 'Travel friendly', 'Everyday comfort'],
    variants: variants(['Cream', 'Black'], [36, 37, 38, 39, 40, 41], '/catalog/products/women-flat-main.jpeg', 10), rating: 4.6, saleCount: 67,
  },
  {
    slug: 'sunlit-cross-strap-sandals', name: 'Sunlit Cross-Strap Sandals', collectionKey: 'everyday',
    description: 'A relaxed warm-weather sandal with soft crossing straps and a walkable base. Pair it with lawn, linen or weekend denim for a clean casual finish.',
    shortDescription: 'Relaxed cross-strap sandals made for warm everyday wear.', price: 2290, originalPrice: 2690, discount: 15,
    image: '/catalog/products/casual-sandal-main.jpeg', images: ['/catalog/products/casual-sandal-main.jpeg', '/catalog/products/casual-sandal-detail-1.jpeg'],
    advantages: ['Walkable low sole', 'Soft straps', 'Breathable open design', 'Lightweight construction'],
    specifications: { Material: 'Vegan leather', Heel: '0.5 inch', Sole: 'Textured TPR', Fit: 'Regular' },
    features: ['Summer edit', 'Everyday wear', 'Minimal profile'],
    variants: variants(['Tan', 'White'], [36, 37, 38, 39, 40, 41], '/catalog/products/casual-sandal-main.jpeg', 9), rating: 4.5, saleCount: 54,
  },
  {
    slug: 'lilac-daily-wear-flats', name: 'Lilac Daily-Wear Flats', collectionKey: 'women',
    description: 'A feminine flat with a softly structured upper and dependable everyday sole. The subtle colour lifts neutral wardrobes while remaining easy to wear.',
    shortDescription: 'A softly structured flat that adds colour to everyday looks.', price: 2690, originalPrice: null, discount: 0,
    image: '/catalog/products/daily-wear-main.jpeg', images: ['/catalog/products/daily-wear-main.jpeg', '/catalog/products/daily-wear-detail-1.jpeg', '/catalog/products/daily-wear-detail-2.jpeg'],
    advantages: ['Soft upper', 'Padded footbed', 'Low-profile sole', 'Easy day-to-evening styling'],
    specifications: { Material: 'Textile and synthetic', Heel: 'Flat', Sole: 'Rubber', Fit: 'True to size' },
    features: ['New arrival', 'Soft colour story', 'Day-long comfort'],
    variants: variants(['Lilac', 'Nude'], [36, 37, 38, 39, 40, 41], '/catalog/products/daily-wear-main.jpeg', 7), rating: 4.4, saleCount: 21,
  },
  {
    slug: 'rose-gold-event-shoes', name: 'Rose Gold Event Shoes', collectionKey: 'women',
    description: 'A polished event shoe with a subtle shine and comfortable inner padding. Designed as an elegant finishing touch for festive dinners, nikkah events and family celebrations.',
    shortDescription: 'Softly shimmering event shoes with comfortable inner padding.', price: 3890, originalPrice: 4590, discount: 15,
    image: '/catalog/products/party-shoe-main.jpeg', images: ['/catalog/products/party-shoe-main.jpeg', '/catalog/products/party-shoe-detail-1.jpeg'],
    advantages: ['Occasion-ready finish', 'Padded inner', 'Stable sole', 'Easy festive pairing'],
    specifications: { Material: 'Metallic synthetic', Heel: '2 inches', Sole: 'Anti-slip rubber', Occasion: 'Festive' },
    features: ['Festive edit', 'Soft shimmer', 'Comfort lining'],
    variants: variants(['Rose Gold', 'Silver'], [36, 37, 38, 39, 40, 41], '/catalog/products/party-shoe-main.jpeg', 5), rating: 4.8, saleCount: 43,
  },
  {
    slug: 'signature-leather-loafers', name: 'Signature Leather Loafers', collectionKey: 'men',
    description: 'A refined formal loafer with clean stitching, supportive construction and a versatile silhouette. Built to move easily between office days, dinners and formal occasions.',
    shortDescription: 'Refined menâ€™s loafers for office days and formal occasions.', price: 5490, originalPrice: 6290, discount: 13,
    image: '/catalog/products/men-formal-main.webp', images: ['/catalog/products/men-formal-main.webp', '/catalog/products/men-formal-detail-1.jpg', '/catalog/products/men-formal-detail-2.jpg'],
    advantages: ['Supportive construction', 'Cushioned heel', 'Durable outsole', 'Versatile formal profile'],
    specifications: { Material: 'Leather-finish upper', Lining: 'Breathable textile', Sole: 'Durable rubber', Fit: 'Regular' },
    features: ['Office essential', 'Formal edit', 'Cushioned step'],
    variants: variants(['Black', 'Tan'], [40, 41, 42, 43, 44, 45], '/catalog/products/men-formal-main.webp', 8), rating: 4.8, saleCount: 58,
  },
  {
    slug: 'petal-play-kids-sandals', name: 'Petal Play Kids Sandals', collectionKey: 'kids',
    description: 'A cheerful lightweight sandal with a secure adjustable strap and flexible sole. The closed support points help little feet stay comfortable through playdates and family outings.',
    shortDescription: 'Lightweight floral sandals with an adjustable kids fit.', price: 1890, originalPrice: 2190, discount: 14,
    image: '/catalog/products/kids-pink-main.webp', images: ['/catalog/products/kids-pink-main.webp', '/catalog/products/kids-pink-detail-1.jpg'],
    advantages: ['Adjustable strap', 'Flexible sole', 'Lightweight feel', 'Easy-clean upper'],
    specifications: { Material: 'Soft synthetic', Closure: 'Hook-and-loop', Sole: 'Flexible TPR', Fit: 'Kids regular' },
    features: ['Kids collection', 'Secure fit', 'Play-ready comfort'],
    variants: variants(['Pink', 'White'], [26, 27, 28, 29, 30, 31, 32], '/catalog/products/kids-pink-main.webp', 9), rating: 4.7, saleCount: 46,
  },
];

productSeeds.push(
  catalogProduct({ slug: 'pearl-knot-mules', name: 'Pearl Knot Mules', collectionKey: 'women_heels', description: 'Elegant pearl-detailed mules with a stable heel for festive evenings and wedding events.', price: 3990, image: '/catalog/products/pearl-mule-main.jpeg', images: ['/catalog/products/pearl-mule-main.jpeg', '/catalog/products/pearl-mule-detail-1.jpeg', '/catalog/products/pearl-mule-detail-2.jpeg'], colors: ['Ivory', 'Gold'], sizes: [36, 37, 38, 39, 40, 41], rating: 4.8, saleCount: 52, discount: 12 }),
  catalogProduct({ slug: 'classic-nude-pumps', name: 'Classic Nude Pumps', collectionKey: 'women_heels', description: 'A clean pointed pump in soft neutral shades for office tailoring and evening looks.', price: 3790, image: '/catalog/products/nude-pump-main.jpeg', images: ['/catalog/products/nude-pump-main.jpeg', '/catalog/products/nude-pump-detail-1.jpeg', '/catalog/products/nude-pump-detail-2.jpeg'], colors: ['Nude', 'Black'], sizes: [36, 37, 38, 39, 40, 41], rating: 4.6, saleCount: 34 }),
  catalogProduct({ slug: 'embroidered-festive-flats', name: 'Embroidered Festive Flats', collectionKey: 'women_flats', description: 'A softly padded festive flat with embroidered detail for intimate celebrations and family dinners.', price: 3290, image: '/catalog/products/embroidered-flat-main.jpeg', images: ['/catalog/products/embroidered-flat-main.jpeg', '/catalog/products/embroidered-flat-detail.jpeg'], colors: ['Maroon', 'Navy'], sizes: [36, 37, 38, 39, 40, 41], rating: 4.7, saleCount: 45, discount: 10 }),
  catalogProduct({ slug: 'bow-detail-comfort-flats', name: 'Bow Detail Comfort Flats', collectionKey: 'women_flats', description: 'Flexible bow-detail flats designed for errands, workdays and travel.', price: 2590, image: '/catalog/products/bow-flat-main.jpeg', images: ['/catalog/products/bow-flat-main.jpeg', '/catalog/products/bow-flat-detail-1.jpeg', '/catalog/products/bow-flat-detail-2.jpeg'], colors: ['Black', 'Beige'], sizes: [36, 37, 38, 39, 40, 41], rating: 4.5, saleCount: 63 }),
  catalogProduct({ slug: 'minimal-buckle-sandals', name: 'Minimal Buckle Sandals', collectionKey: 'women_sandals', description: 'A lightweight buckle sandal with a clean profile and comfortable day-long base.', price: 2390, image: '/catalog/products/city-casual-main.jpeg', colors: ['Black', 'Tan', 'White'], sizes: [36, 37, 38, 39, 40, 41], rating: 4.5, saleCount: 41, discount: 8 }),
  catalogProduct({ slug: 'velvet-bridal-mules', name: 'Velvet Bridal Mules', collectionKey: 'bridal', description: 'Soft velvet bridal mules with a refined finish and walkable occasion heel.', price: 4590, image: '/catalog/products/pearl-mule-main.jpeg', images: ['/catalog/products/pearl-mule-main.jpeg', '/catalog/products/bridal-ivory-detail-1.jpeg'], colors: ['Ivory', 'Blush'], sizes: [36, 37, 38, 39, 40, 41], rating: 4.9, saleCount: 57, discount: 14, material: 'Velvet finish upper' }),
  catalogProduct({ slug: 'executive-cap-toe-oxfords', name: 'Executive Cap-Toe Oxfords', collectionKey: 'men_formal', description: 'Structured cap-toe Oxfords that bring a polished foundation to office and formal wardrobes.', price: 5890, image: '/catalog/products/men-formal-main.webp', images: ['/catalog/products/men-formal-main.webp', '/catalog/products/men-formal-detail-1.jpg'], colors: ['Black', 'Tan'], sizes: [40, 41, 42, 43, 44, 45], rating: 4.8, saleCount: 61, discount: 11, material: 'Leather-finish upper' }),
  catalogProduct({ slug: 'city-derby-shoes', name: 'City Derby Shoes', collectionKey: 'men_formal', description: 'A versatile Derby silhouette with a supportive heel and understated stitched finish.', price: 5290, image: '/catalog/products/men-formal-main.webp', images: ['/catalog/products/men-formal-main.webp', '/catalog/products/men-formal-detail-1.jpg'], colors: ['Tan', 'Dark Brown'], sizes: [40, 41, 42, 43, 44, 45], rating: 4.6, saleCount: 38 }),
  catalogProduct({ slug: 'black-tassel-loafers', name: 'Black Tassel Loafers', collectionKey: 'men', description: 'Smart tassel loafers with an easy slip-on fit for meetings, dinners and semi-formal events.', price: 4990, image: '/catalog/products/men-formal-main.webp', colors: ['Black', 'Burgundy'], sizes: [40, 41, 42, 43, 44, 45], rating: 4.7, saleCount: 49, discount: 9 }),
  catalogProduct({ slug: 'weekend-slip-ons', name: 'Weekend Slip-Ons', collectionKey: 'men_casual', description: 'Relaxed slip-ons with flexible cushioning for travel, errands and off-duty days.', price: 3490, image: '/collections/formal.webp', colors: ['Navy', 'Grey'], sizes: [40, 41, 42, 43, 44, 45], rating: 4.5, saleCount: 42 }),
  catalogProduct({ slug: 'heritage-peshawari-sandals', name: 'Heritage Peshawari Sandals', collectionKey: 'men_sandals', description: 'A traditional-inspired sandal profile updated with supportive everyday cushioning.', price: 4290, image: '/collections/picture2.webp', colors: ['Brown', 'Black'], sizes: [40, 41, 42, 43, 44, 45], rating: 4.8, saleCount: 70, discount: 10, material: 'Textured leather-finish upper' }),
  catalogProduct({ slug: 'urban-lace-up-sneakers', name: 'Urban Lace-Up Sneakers', collectionKey: 'men_casual', description: 'Clean everyday sneakers with a padded collar and flexible movement-ready sole.', price: 4490, image: '/collections/picture1.webp', colors: ['White', 'Black'], sizes: [40, 41, 42, 43, 44, 45], rating: 4.6, saleCount: 55 }),
  catalogProduct({ slug: 'men-comfort-slides', name: 'Men Comfort Slides', collectionKey: 'men_sandals', description: 'Easy cushioned slides for relaxed weekends, travel and casual everyday wear.', price: 1990, image: '/collections/picture2.webp', colors: ['Black', 'Olive'], sizes: [40, 41, 42, 43, 44, 45], rating: 4.4, saleCount: 36 }),
  catalogProduct({ slug: 'school-day-velcro-shoes', name: 'School-Day Velcro Shoes', collectionKey: 'kids_school', description: 'Easy-clean school shoes with a secure hook-and-loop strap and flexible sole.', price: 2490, image: '/collections/kids.webp', colors: ['Black', 'Navy'], sizes: [28, 29, 30, 31, 32, 33, 34], rating: 4.7, saleCount: 64, material: 'Easy-clean synthetic upper' }),
  catalogProduct({ slug: 'rainbow-play-sandals', name: 'Rainbow Play Sandals', collectionKey: 'kids', description: 'Colourful play sandals with adjustable support for warm afternoons and family outings.', price: 1790, image: '/catalog/products/embroidered-flat-main.jpeg', colors: ['Pink', 'Purple'], sizes: [26, 27, 28, 29, 30, 31, 32], rating: 4.6, saleCount: 47, discount: 8 }),
  catalogProduct({ slug: 'junior-party-flats', name: 'Junior Party Flats', collectionKey: 'kids_party', description: 'Soft bow-detail party flats made for birthdays, weddings and family celebrations.', price: 2190, image: '/catalog/products/bow-flat-main.jpeg', colors: ['Pink', 'Gold'], sizes: [27, 28, 29, 30, 31, 32, 33], rating: 4.8, saleCount: 39 }),
  catalogProduct({ slug: 'mini-adventure-sandals', name: 'Mini Adventure Sandals', collectionKey: 'kids', description: 'Flexible outdoor sandals with dependable straps for active little explorers.', price: 1990, image: '/collections/picture2.webp', colors: ['Blue', 'Orange'], sizes: [27, 28, 29, 30, 31, 32, 33], rating: 4.5, saleCount: 44 }),
  catalogProduct({ slug: 'star-light-slip-ons', name: 'Star-Light Slip-Ons', collectionKey: 'kids_school', description: 'Lightweight slip-ons with a flexible base for school runs and everyday play.', price: 2290, image: '/catalog/products/city-casual-main.jpeg', colors: ['Navy', 'Grey'], sizes: [28, 29, 30, 31, 32, 33, 34], rating: 4.4, saleCount: 31 }),
  catalogProduct({ slug: 'glitter-occasion-sandals', name: 'Glitter Occasion Sandals', collectionKey: 'kids_party', description: 'A sparkly but comfortable occasion sandal with a secure adjustable fit.', price: 2390, image: '/catalog/products/kids-pink-main.webp', colors: ['Silver', 'Pink'], sizes: [27, 28, 29, 30, 31, 32, 33], rating: 4.7, saleCount: 43, discount: 9 }),
  catalogProduct({ slug: 'cozy-home-slippers', name: 'Cozy Home Slippers', collectionKey: 'slippers', description: 'Soft indoor slippers with a cushioned footbed for slow mornings and relaxed evenings.', price: 1590, image: '/collections/picture2.webp', colors: ['Grey', 'Beige'], sizes: [36, 37, 38, 39, 40, 41, 42, 43], rating: 4.6, saleCount: 59 }),
  catalogProduct({ slug: 'easy-pool-slides', name: 'Easy Pool Slides', collectionKey: 'slippers', description: 'Quick-dry lightweight slides for pool days, travel and casual home wear.', price: 1390, image: '/Banner/pair-black-flip-flops-asphalt.jpg', colors: ['Black', 'Blue'], sizes: [36, 37, 38, 39, 40, 41, 42, 43, 44], rating: 4.4, saleCount: 53, discount: 7 }),
);

const bannerSeeds = [
  { category: 'HOME_MAIN', desktopImageUrl: '/catalog/campaigns/homepage-hero.png', mobileImageUrl: '/catalog/campaigns/homepage-hero.png', title: 'Every Step, Styled', subtitle: 'A complete collection for workdays, celebrations and little adventures.', textPosition: 'OVERLAY', ctaText: 'Explore Collection', ctaLink: '/products', order: 0 },
  { category: 'HOME_MAIN', desktopImageUrl: '/catalog/campaigns/seasonal-style-guide.png', mobileImageUrl: '/catalog/products/pearl-mule-main.jpeg', title: 'Occasion Ready', subtitle: 'Polished heels, flats and festive details for every celebration.', textPosition: 'OVERLAY', ctaText: 'Shop Occasion Styles', ctaLink: '/products?gender=women', order: 1 },
  { category: 'HOME_MAIN', desktopImageUrl: '/catalog/campaigns/shoe-care-guide.png', mobileImageUrl: '/catalog/products/men-formal-main.webp', title: 'Modern Classics', subtitle: 'Timeless formal footwear built around confident comfort.', textPosition: 'OVERLAY', ctaText: 'Discover Men', ctaLink: '/products?gender=men', order: 2 },
  { category: 'WOMEN_SECTION', desktopImageUrl: '/catalog/campaigns/seasonal-style-guide.png', mobileImageUrl: '/catalog/campaigns/seasonal-style-guide.png', title: "The Women's Edit", subtitle: 'Polished pairs for everyday dressing and standout occasions.', textPosition: 'OUTSIDE_RIGHT', ctaText: 'Shop Women', ctaLink: '/products?gender=women', order: 0 },
  { category: 'MEN_SECTION', desktopImageUrl: '/collections/men.webp', mobileImageUrl: '/collections/formal.webp', title: 'Smart Foundations', subtitle: 'Formal profiles with day-long comfort.', textPosition: 'OUTSIDE_LEFT', ctaText: 'Shop Men', ctaLink: '/products?gender=men', order: 0 },
  { category: 'KIDS_SECTION', desktopImageUrl: '/collections/kids.webp', mobileImageUrl: '/catalog/products/kids-pink-main.webp', title: 'Little Steps, Big Days', subtitle: 'Play-ready comfort in cheerful colours.', textPosition: 'OUTSIDE_RIGHT', ctaText: 'Shop Kids', ctaLink: '/products?gender=kids', order: 0 },
  { category: 'SALE_BANNER', desktopImageUrl: '/catalog/campaigns/homepage-hero.png', mobileImageUrl: '/catalog/campaigns/seasonal-style-guide.png', title: 'Seasonal Sale', subtitle: 'Save up to 16% across selected styles.', textPosition: 'OUTSIDE_RIGHT', ctaText: 'View Sale', ctaLink: '/products?onSale=true', order: 0 },
];

const demoBannerTitles = bannerSeeds.map((banner) => banner.title);
const legacyDemoBannerTitles = ['[DEMO] Every Step, Styled', '[DEMO] Occasion Ready', '[DEMO] Modern Classics', '[DEMO] The Women’s Edit', '[DEMO] Smart Foundations', '[DEMO] Little Steps, Big Days', '[DEMO] Preview Sale'];

const blogSeeds = [
  {
    slug: 'how-to-care-for-everyday-shoes', title: 'How to Keep Everyday Shoes Looking Fresh',
    description: 'A simple care routine for leather-look loafers, flats and occasion footwear.', image: '/catalog/campaigns/shoe-care-guide.png',
    images: ['/catalog/products/men-formal-detail-1.jpg', '/catalog/products/women-flat-detail-1.jpeg'], author: 'Step & Style Editorial', category: 'Shoe Care', tags: ['care', 'footwear', 'everyday'],
    content: `<p>Good shoe care starts before the first wear. A few small habits can help your favourite pairs hold their shape, colour and comfort for longer.</p><h2>1. Rotate your pairs</h2><p>Give frequently worn shoes a day to air between uses. This helps the lining dry naturally and allows the upper to recover its shape.</p><h2>2. Clean gently and regularly</h2><p>Use a dry soft brush for surface dust. For synthetic or leather-look uppers, test a barely damp cloth on a hidden area before wiping the full shoe.</p><h2>3. Store with support</h2><p>Keep formal shoes away from direct sunlight and use tissue or a shoe tree to support the toe box. Store embellished pairs separately so details do not catch.</p><h2>4. Protect the sole</h2><p>Let wet soles dry naturally at room temperature. Avoid direct heaters, which can weaken adhesives and make some materials brittle.</p><p><em>This guide provides general care information. Always follow the material-specific care label supplied with the product.</em></p>`,
  },
  {
    slug: 'find-your-comfortable-shoe-size', title: 'A Practical Guide to Finding Your Most Comfortable Size',
    description: 'Measure at home, compare both feet and understand when the fit is right.', image: '/catalog/campaigns/homepage-hero.png',
    images: ['/catalog/products/bridal-ivory-detail-2.jpeg', '/catalog/products/kids-pink-detail-1.jpg'], author: 'Step & Style Fit Team', category: 'Fit Guide', tags: ['size guide', 'comfort', 'shopping'],
    content: `<p>A reliable fit begins with a quick measurement. Measure both feet late in the day, when they are naturally at their fullest, and use the larger measurement as your guide.</p><h2>Check length and width</h2><p>Your toes should have a little breathing room without the foot sliding forward. The widest part of your foot should sit comfortably inside the widest part of the shoe.</p><h2>Consider the shoe shape</h2><p>Pointed styles can feel closer at the toe than round or open silhouettes. If you are between sizes, the product fit note and material flexibility should guide your decision.</p><h2>Try pairs correctly</h2><p>Use the socks or hosiery you plan to wear, walk on a clean indoor surface and check that the heel stays secure without rubbing.</p><p><em>Use each product's size and fit guidance before placing your order.</em></p>`,
  },
  {
    slug: 'five-footwear-styles-for-a-versatile-wardrobe', title: 'Five Footwear Styles for a More Versatile Wardrobe',
    description: 'Build more outfits with a focused mix of flats, loafers, sandals and event heels.', image: '/catalog/campaigns/seasonal-style-guide.png',
    images: ['/catalog/products/women-heel-main.jpeg', '/catalog/products/casual-sandal-main.jpeg'], author: 'Step & Style Editorial', category: 'Style Notes', tags: ['style', 'wardrobe', 'trends'],
    content: `<p>A versatile shoe wardrobe does not need to be large. The right mix of silhouettes can move easily between everyday errands, office hours and celebrations.</p><h2>1. A comfortable neutral flat</h2><p>Choose cream, tan or black for maximum outfit options. Look for a flexible sole and enough cushioning for repeated wear.</p><h2>2. A polished loafer</h2><p>Loafers add structure to tailoring and can also sharpen denim or relaxed eastern separates.</p><h2>3. A walkable sandal</h2><p>Minimal straps and a supportive low sole make a sandal useful across warm-weather wardrobes.</p><h2>4. A stable event heel</h2><p>A block heel brings height while offering a broader base for wedding functions and long dinners.</p><h2>5. One expressive pair</h2><p>A soft colour, metallic finish or embellished detail can refresh simple outfits without changing the whole wardrobe.</p>`,
  },
  {
    slug: 'occasion-shoes-without-the-discomfort', title: 'Choosing Occasion Shoes Without Giving Up Comfort',
    description: 'Look beyond heel height and focus on stability, lining, toe shape and a secure fit.', image: '/catalog/products/pearl-mule-main.jpeg',
    images: ['/catalog/products/bridal-ivory-main.jpeg', '/catalog/products/nude-pump-main.jpeg'], author: 'Step & Style Editorial', category: 'Occasion Guide', tags: ['weddings', 'comfort', 'heels'],
    content: `<p>The most memorable occasion shoes balance visual impact with a fit you can trust.</p><h2>Start with stability</h2><p>A block heel or broader base can feel more secure during long events. Check that the heel sits straight beneath your weight.</p><h2>Notice the lining</h2><p>Soft contact points around the toes and heel reduce friction. A padded footbed also helps during extended standing.</p><h2>Choose a secure profile</h2><p>An ankle strap, supportive mule upper or well-shaped pump should hold the foot without pinching.</p><p>Always test occasion footwear indoors before the event and keep the final supplier fit guidance close to hand.</p>`,
  },
  {
    slug: 'kids-footwear-fit-checklist', title: 'A Parentâ€™s Quick Kids Footwear Fit Checklist',
    description: 'Five simple checks for secure, flexible and comfortable growing-foot fit.', image: '/collections/kids.webp',
    images: ['/catalog/products/kids-pink-main.webp', '/catalog/products/city-casual-main.jpeg'], author: 'Step & Style Fit Team', category: 'Kids Guide', tags: ['kids', 'fit', 'parents'],
    content: `<p>Growing feet need space, support and flexibility in the right places.</p><h2>Check toe room</h2><p>There should be comfortable movement at the front without the shoe feeling loose through the middle.</p><h2>Secure the heel</h2><p>The heel should stay in place during walking. Adjustable straps are useful when fine-tuning a childâ€™s fit.</p><h2>Test flexibility</h2><p>The sole should bend naturally near the forefoot rather than folding through the middle.</p><h2>Recheck regularly</h2><p>Children can change sizes quickly, so review the fit whenever you notice pressure marks or a change in walking comfort.</p>`,
  },
  {
    slug: 'build-a-smart-workweek-shoe-rotation', title: 'Build a Smarter Workweek Shoe Rotation',
    description: 'A simple three-pair rotation for polished looks and better day-to-day comfort.', image: '/catalog/campaigns/shoe-care-guide.png',
    images: ['/catalog/products/men-formal-main.webp', '/catalog/products/women-flat-main.jpeg'], author: 'Step & Style Editorial', category: 'Workwear', tags: ['office', 'loafers', 'flats'],
    content: `<p>A small workweek rotation can cover most office wardrobes while giving each pair time to recover between wears.</p><h2>The polished anchor</h2><p>Keep one structured loafer, Oxford or neutral pump for meetings and formal days.</p><h2>The comfort option</h2><p>A cushioned flat or flexible slip-on works well for commute-heavy schedules.</p><h2>The personality pair</h2><p>Add a subtle colour, texture or metal detail for days when simple outfits need more character.</p><p>Rotate pairs, keep them clean and choose colours that work with several outfits rather than only one.</p>`,
  },
];

const reelSeeds = [
  { title: 'Formal Loafer Close-Up', category: 'PRODUCT_DEMONSTRATIONS', caption: 'A closer look at shape, finish and flexible everyday styling.', videoUrl: '/product/formal.mp4', posterUrl: '/catalog/products/men-formal-main.webp', productLink: '/products/signature-leather-loafers', order: 0 },
  { title: 'Midnight Style in Motion', category: 'TRENDING_PRODUCTS', caption: 'An evening-ready silhouette from every angle.', videoUrl: '/product/black.mp4', posterUrl: '/catalog/products/women-heel-main.jpeg', productLink: '/products/midnight-party-heels', order: 1 },
  { title: 'Occasion Edit', category: 'SHORT_REELS', caption: 'A quick campaign look at the latest collection.', videoUrl: '/mp_.mp4', posterUrl: '/catalog/campaigns/homepage-hero.png', productLink: '/products?gender=women', order: 2 },
  { title: 'Everyday Comfort Detail', category: 'PRODUCT_DEMONSTRATIONS', caption: 'Soft structure and simple styling for repeat wear.', videoUrl: '/product/formal.mp4', posterUrl: '/catalog/products/women-flat-main.jpeg', productLink: '/products/cloud-soft-ballet-flats', order: 3 },
];

const demoReelTitles = reelSeeds.map((reel) => reel.title);
const legacyDemoReelTitles = ['[DEMO] Formal Loafer Close-Up', '[DEMO] Midnight Style in Motion', '[DEMO] Occasion Edit Preview', '[DEMO] Everyday Comfort Detail'];

const reviewTemplates = [
  { userName: 'Ayesha Khan', rating: 5, comment: 'The finish looks polished and the cushioning felt comfortable from the first wear.' },
  { userName: 'Sara Ahmed', rating: 4, comment: 'The size guide was helpful and the pair looks just as elegant in person.' },
  { userName: 'Hira Malik', rating: 5, comment: 'Comfortable enough for a long family event, and the sole felt secure while walking.' },
  { userName: 'Mariam Raza', rating: 5, comment: 'Neat packaging, lovely colour and a very wearable fit for everyday outfits.' },
  { userName: 'Zainab Ali', rating: 4, comment: 'A versatile design with good padding. I would happily style it again.' },
  { userName: 'Fatima Noor', rating: 5, comment: 'The details feel premium and the shape is flattering without compromising comfort.' },
];

async function seed() {
  const collectionIds = {};
  for (const collection of collectionSeeds) {
    const { key, ...data } = collection;
    const saved = await prisma.collection.upsert({ where: { slug: data.slug }, update: data, create: data });
    collectionIds[key] = saved.id;
  }

  const savedProducts = [];
  const now = new Date();
  for (const product of productSeeds) {
    const { collectionKey, ...productData } = product;
    const data = { ...productData, collectionId: collectionIds[collectionKey], inStock: productData.variants.some((variant) => variant.stock > 0), createdAt: now };
    const saved = await prisma.product.upsert({ where: { slug: product.slug }, update: data, create: data });
    savedProducts.push(saved);
  }

  const maleNames = ['Hassan Ali', 'Usman Raza', 'Bilal Khan', 'Faisal Ahmed', 'Tariq Mahmood', 'Zain Malik'];
  const femaleNames = ['Ayesha Khan', 'Sara Ahmed', 'Hira Malik', 'Mariam Raza', 'Zainab Ali', 'Fatima Noor'];
  await prisma.review.deleteMany({ where: { OR: [{ userEmail: DEMO_REVIEW_EMAIL }, { userEmail: 'demo-review@stepandstyle.test' }, { productId: { in: savedProducts.map((product) => product.id) } }] } });
  for (let productIndex = 0; productIndex < savedProducts.length; productIndex += 1) {
    const product = savedProducts[productIndex];
    const isMenProduct = product.slug.includes('men') || product.slug.includes('oxford') || product.slug.includes('derby') || product.slug.includes('peshawari') || product.slug.includes('tassel');
    for (let reviewIndex = 0; reviewIndex < 3; reviewIndex += 1) {
      const template = reviewTemplates[(productIndex + reviewIndex) % reviewTemplates.length];
      const namesList = isMenProduct ? maleNames : femaleNames;
      const userName = namesList[(productIndex + reviewIndex) % namesList.length];
      const createdAt = new Date(now.getTime() - (productIndex * 3 + reviewIndex + 1) * 86_400_000);
      await prisma.review.create({ data: { ...template, userName, userEmail: DEMO_REVIEW_EMAIL, productId: product.id, status: 'APPROVED', moderatedAt: createdAt, moderationNote: 'Catalog review approved during content setup.', isFeatured: reviewIndex === 0 && template.rating === 5, images: productIndex < 12 && reviewIndex === 0 ? [product.image] : [], createdAt } });
    }
  }

  await prisma.banner.deleteMany({ where: { title: { in: [...demoBannerTitles, ...legacyDemoBannerTitles] } } });
  await prisma.banner.createMany({ data: bannerSeeds.map((banner) => ({ ...banner, desktopImageSlot: 1, mobileImageSlot: 2, isActive: true, startDate: null, endDate: null })) });

  for (const blog of blogSeeds) {
    await prisma.blog.upsert({ where: { slug: blog.slug }, update: { ...blog, isPublished: true }, create: { ...blog, isPublished: true } });
  }

  await prisma.homeReel.deleteMany({ where: { title: { in: [...demoReelTitles, ...legacyDemoReelTitles] } } });
  await prisma.homeReel.createMany({ data: reelSeeds.map((reel) => ({ ...reel, isActive: true })) });

  await prisma.saleEvent.deleteMany({ where: { name: LEGACY_DEMO_SALE_NAME } });
  await prisma.saleEvent.upsert({
    where: { name: SEEDED_SALE_NAME },
    update: { bannerText: 'UP TO 16% OFF SELECTED STYLES', discountPercent: 16, targetCollections: [collectionIds.bridal, collectionIds.women, collectionIds.everyday], targetProducts: savedProducts.filter((product) => product.discount > 0).map((product) => product.id), isActive: true },
    create: { name: SEEDED_SALE_NAME, bannerText: 'UP TO 16% OFF SELECTED STYLES', discountPercent: 16, targetCollections: [collectionIds.bridal, collectionIds.women, collectionIds.everyday], targetProducts: savedProducts.filter((product) => product.discount > 0).map((product) => product.id), isActive: true },
  });

  const totals = {
    demoCollections: await prisma.collection.count({ where: { slug: { in: collectionSeeds.map((collection) => collection.slug) } } }),
    demoProducts: await prisma.product.count({ where: { slug: { in: productSeeds.map((product) => product.slug) } } }),
    demoBanners: await prisma.banner.count({ where: { title: { in: demoBannerTitles } } }),
    demoBlogs: await prisma.blog.count({ where: { slug: { in: blogSeeds.map((blog) => blog.slug) } } }),
    demoReviews: await prisma.review.count({ where: { userEmail: DEMO_REVIEW_EMAIL } }),
    demoReels: await prisma.homeReel.count({ where: { title: { in: demoReelTitles } } }),
    demoSales: await prisma.saleEvent.count({ where: { name: SEEDED_SALE_NAME } }),
  };
  console.log('Demo storefront content is ready.');
  console.log(JSON.stringify(totals, null, 2));
}

seed().catch((error) => { console.error('Demo seed failed:', error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
