import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialProducts = [
  {
    slug: 'women-mustard-shoes',
    category: 'WOMEN',
    title: 'Women Mustard Casual Shoes',
    description: 'Comfortable mustard casual shoes designed for everyday wear.',
    shortDescription: 'Mustard Casual Shoes',
    price: 3500,
    salePrice: 2999,
    discount: 15,
    inStock: true,
    image: '/assets/Women/women-mustardshoes.jpeg',
    images: ['/assets/Women/women-mustardshoes.jpeg'],
    colors: ['#E49B0F', '#000000'],
  },
  {
    slug: 'men-formal-sneaker',
    category: 'MEN',
    title: 'Men Formal Sneaker',
    description: 'A stylish and comfortable sneaker for men.',
    shortDescription: 'Formal Sneaker',
    price: 4500,
    salePrice: 4000,
    discount: 11,
    inStock: true,
    image: '/assets/Men/sneaker/sneaker-4.jpeg',
    images: ['/assets/Men/sneaker/sneaker-4.jpeg'],
    colors: ['#1F2937', '#FFFFFF'],
  },
  {
    slug: 'kids-play-shoes',
    category: 'KIDS',
    title: 'Kids Play Shoes',
    description: 'Durable and playful shoes for kids.',
    shortDescription: 'Play Shoes',
    price: 2500,
    salePrice: null,
    discount: 0,
    inStock: true,
    image: '/assets/Kids/kids-2.jpeg',
    images: ['/assets/Kids/kids-2.jpeg'],
    colors: ['#FF0000', '#0000FF'],
  }
];

async function main() {
  console.log('Clearing existing products...');
  await prisma.product.deleteMany({});
  
  console.log('Seeding products...');
  for (const p of initialProducts) {
    await prisma.product.create({
      data: p
    });
    console.log(`Created: ${p.title}`);
  }
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
