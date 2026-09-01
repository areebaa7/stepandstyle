export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  inStock: boolean;
  advantages: string[];
  specifications: Record<string, string | number>;
  features: string[];
  image?: string;
  images?: string[];
}

export const products: Product[] = [
  {
    id: 'bridal-heels-ivory-01',
    name: 'Royal Ivory Bridal Heels',
    brand: 'Bridal',
    description: 'Exquisite ivory bridal heels featuring hand-stitched pearls and a comfortable 3-inch block heel. Perfect for your special day, combining elegance with all-day wearability.',
    shortDescription: 'Elegant pearl-embellished ivory block heels for brides',
    price: 4500,
    salePrice: 6000,
    inStock: true,
    image: '/products/bridal-1.jpg',
    images: ['/products/bridal-1.jpg'],
    advantages: [
      'Hand-crafted premium velvet',
      'Comfortable block heel design',
      'Non-slip sole for safety',
      'Breathable inner lining'
    ],
    specifications: {
      material: 'Premium Velvet',
      heelHeight: '3 Inches',
      color: 'Ivory White',
      sole: 'Anti-slip Rubber'
    },
    features: [
      'Pearl Embellishments',
      'Cushioned Insole',
      'Adjustable Ankle Strap',
      'Handmade Quality'
    ]
  },
  {
    id: 'casual-slippers-velvet-02',
    name: 'Velvet Comfort Slippers',
    brand: 'Slippers',
    description: 'Ultra-soft velvet slippers designed for maximum home comfort. Featuring a memory foam base and plush lining, these are the ultimate treat for your feet.',
    shortDescription: 'Luxurious memory foam velvet slippers for home comfort',
    price: 1200,
    salePrice: 1800,
    inStock: true,
    image: '/products/slippers-1.jpg',
    images: ['/products/slippers-1.jpg'],
    advantages: [
      'Memory foam support',
      'Machine washable material',
      'Ultra-soft plush lining',
      'Durable indoor sole'
    ],
    specifications: {
      material: 'Soft Velvet',
      lining: 'Faux Fur',
      sole: 'Flexible TPR',
      weight: 'Lightweight'
    },
    features: [
      'Memory Foam Base',
      'Breathable Design',
      'Odor Resistant',
      'Available in Multiple Colors'
    ]
  },
  {
    id: 'party-heels-stiletto-03',
    name: 'Midnight Sparkle Stilettos',
    brand: 'Heels',
    description: 'Make a statement with these glitter-finished stilettos. Designed for parties and evening events, featuring a sleek 4-inch heel and pointed toe.',
    shortDescription: 'Glitter-finished stiletto heels for evening wear',
    price: 3800,
    salePrice: 5500,
    inStock: true,
    image: '/products/heels-1.jpg',
    images: ['/products/heels-1.jpg'],
    advantages: [
      'Stunning sparkle finish',
      'Pointed toe elegance',
      'Stable stiletto construction',
      'Premium synthetic leather'
    ],
    specifications: {
      material: 'Glitter Synthetic',
      heelHeight: '4 Inches',
      type: 'Stiletto',
      occasion: 'Party / Evening'
    },
    features: [
      'Pointed Toe',
      'Secure Heel Grip',
      'Reinforced Shank',
      'Premium Finish'
    ]
  }
];

export function getProductById(id: string): Product | undefined {
  return products.find(product => product.id === id);
}

export function getProductsByBrand(brand: string): Product[] {
  return products.filter(product => product.brand === brand);
}
