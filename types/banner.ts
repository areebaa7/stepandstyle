export type BannerCategory =
  | 'HOME_MAIN'
  | 'WOMEN_SECTION'
  | 'MEN_SECTION'
  | 'KIDS_SECTION'
  | 'SALE_BANNER';

export type BannerTextPosition = 'OVERLAY' | 'OUTSIDE_LEFT' | 'OUTSIDE_RIGHT';

export interface BannerDTO {
  id: string;
  category: BannerCategory;
  desktopImageUrl: string;
  mobileImageUrl: string;
  desktopImageSlot?: 1 | 2 | null;
  mobileImageSlot?: 1 | 2 | null;
  title: string | null;
  subtitle: string | null;
  textPosition: BannerTextPosition;
  ctaText: string | null;
  ctaLink: string | null;
  isActive: boolean;
  order: number;
  startDate: string | null;
  endDate: string | null;
  createdAt?: string;
  updatedAt?: string;
}
