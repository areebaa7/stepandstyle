import type { BannerCategory, BannerTextPosition } from '@/types/banner';

export const BANNER_CATEGORIES: BannerCategory[] = [
  'HOME_MAIN',
  'WOMEN_SECTION',
  'MEN_SECTION',
  'KIDS_SECTION',
  'SALE_BANNER',
];

export const BANNER_TEXT_POSITIONS: BannerTextPosition[] = [
  'OVERLAY',
  'OUTSIDE_LEFT',
  'OUTSIDE_RIGHT',
];

type UnknownRecord = Record<string, unknown>;

export class BannerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BannerValidationError';
  }
}

type NormalizedBannerData = {
  category?: BannerCategory;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  desktopImageSlot?: 1 | 2;
  mobileImageSlot?: 1 | 2;
  title?: string | null;
  subtitle?: string | null;
  textPosition?: BannerTextPosition;
  ctaText?: string | null;
  ctaLink?: string | null;
  isActive?: boolean;
  order?: number;
  startDate?: Date | null;
  endDate?: Date | null;
};

const optionalText = (value: unknown, field: string) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new BannerValidationError(`${field} must be text.`);
  }
  return value.trim() || null;
};

const requiredUrl = (value: unknown, field: string, required: boolean) => {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !value.trim()) {
    throw new BannerValidationError(`${field} is required.`);
  }

  const url = value.trim();
  if (!url.startsWith('/') && !/^https?:\/\//i.test(url)) {
    throw new BannerValidationError(`${field} must be a valid relative or HTTP(S) URL.`);
  }
  return url;
};

const optionalCtaLink = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new BannerValidationError('CTA link must be text.');
  }

  const link = value.trim();
  if (!link) return null;
  if (!link.startsWith('/') && !link.startsWith('#') && !/^https?:\/\//i.test(link)) {
    throw new BannerValidationError('CTA link must be a relative path, anchor, or HTTP(S) URL.');
  }
  return link;
};

const optionalDate = (value: unknown, field: string) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new BannerValidationError(`${field} must be a valid date.`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BannerValidationError(`${field} must be a valid date.`);
  }
  return date;
};

const imageSlot = (value: unknown, field: string, fallback: 1 | 2, partial: boolean) => {
  if (value === undefined && partial) return undefined;
  const slot = value ?? fallback;
  if (slot !== 1 && slot !== 2) {
    throw new BannerValidationError(`${field} must be Image 1 or Image 2.`);
  }
  return slot;
};

export function normalizeBannerData(input: unknown, partial = false): NormalizedBannerData {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BannerValidationError('Invalid banner data.');
  }

  const data = input as UnknownRecord;
  const normalized: NormalizedBannerData = {};

  if (data.category !== undefined || !partial) {
    const category = data.category ?? 'HOME_MAIN';
    if (typeof category !== 'string' || !BANNER_CATEGORIES.includes(category as BannerCategory)) {
      throw new BannerValidationError('Invalid banner category.');
    }
    normalized.category = category as BannerCategory;
  }

  normalized.desktopImageUrl = requiredUrl(data.desktopImageUrl, 'Desktop image', !partial);
  normalized.mobileImageUrl = requiredUrl(
    data.mobileImageUrl,
    'Mobile image',
    !partial
  );
  normalized.desktopImageSlot = imageSlot(data.desktopImageSlot, 'Desktop image selection', 1, partial);
  normalized.mobileImageSlot = imageSlot(data.mobileImageSlot, 'Mobile image selection', 2, partial);

  if (data.textPosition !== undefined || !partial) {
    const textPosition = data.textPosition ?? 'OVERLAY';
    if (
      typeof textPosition !== 'string' ||
      !BANNER_TEXT_POSITIONS.includes(textPosition as BannerTextPosition)
    ) {
      throw new BannerValidationError('Invalid text position.');
    }
    normalized.textPosition = textPosition as BannerTextPosition;
  }

  normalized.title = optionalText(data.title, 'Title');
  normalized.subtitle = optionalText(data.subtitle, 'Subtitle');
  normalized.ctaText = optionalText(data.ctaText, 'CTA text');
  normalized.ctaLink = optionalCtaLink(data.ctaLink);

  if (data.isActive !== undefined || !partial) {
    if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
      throw new BannerValidationError('Active status must be true or false.');
    }
    normalized.isActive = (data.isActive as boolean | undefined) ?? true;
  }

  if (data.order !== undefined || !partial) {
    const order = data.order ?? 0;
    if (typeof order !== 'number' || !Number.isInteger(order)) {
      throw new BannerValidationError('Banner order must be a whole number.');
    }
    normalized.order = order;
  }

  normalized.startDate = optionalDate(data.startDate, 'Start date');
  normalized.endDate = optionalDate(data.endDate, 'End date');

  if (
    normalized.startDate instanceof Date &&
    normalized.endDate instanceof Date &&
    normalized.startDate > normalized.endDate
  ) {
    throw new BannerValidationError('End date must be after the start date.');
  }

  return normalized;
}
