export type ReelCategory =
  | 'TRENDING_PRODUCTS'
  | 'CUSTOMER_REVIEWS'
  | 'PRODUCT_DEMONSTRATIONS'
  | 'SHORT_REELS';

export interface ReelDTO {
  id: string;
  category: ReelCategory;
  title: string;
  caption: string | null;
  videoUrl: string;
  posterUrl: string | null;
  productLink: string | null;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}
