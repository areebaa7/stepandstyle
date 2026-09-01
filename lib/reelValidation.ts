import type { ReelCategory } from '@/types/reel';

export const REEL_CATEGORIES: ReelCategory[] = [
  'TRENDING_PRODUCTS',
  'CUSTOMER_REVIEWS',
  'PRODUCT_DEMONSTRATIONS',
  'SHORT_REELS',
];

export class ReelValidationError extends Error {}

const optionalText = (value: unknown, field: string, maxLength: number) => {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') throw new ReelValidationError(`${field} must be text.`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new ReelValidationError(`${field} must be ${maxLength} characters or fewer.`);
  }
  return trimmed || null;
};

const mediaUrl = (value: unknown, field: string, required: boolean) => {
  if (value === undefined && !required) return undefined;
  if (typeof value !== 'string' || !value.trim()) {
    throw new ReelValidationError(`${field} is required.`);
  }

  const normalized = value.trim();
  if (normalized.startsWith('/')) return normalized;

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error();
  } catch {
    throw new ReelValidationError(`${field} must be a valid web or site-relative URL.`);
  }

  return normalized;
};

export function normalizeReelData(body: unknown, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ReelValidationError('Invalid reel data.');
  }

  const input = body as Record<string, unknown>;
  const data: {
    category?: ReelCategory;
    title?: string;
    caption?: string | null;
    videoUrl?: string;
    posterUrl?: string | null;
    productLink?: string | null;
    isActive?: boolean;
    order?: number;
  } = {};

  if (!partial || input.category !== undefined) {
    if (typeof input.category !== 'string' || !REEL_CATEGORIES.includes(input.category as ReelCategory)) {
      throw new ReelValidationError('Invalid reel category.');
    }
    data.category = input.category as ReelCategory;
  }

  if (!partial || input.title !== undefined) {
    if (typeof input.title !== 'string' || !input.title.trim()) {
      throw new ReelValidationError('Title is required.');
    }
    const title = input.title.trim();
    if (title.length > 100) throw new ReelValidationError('Title must be 100 characters or fewer.');
    data.title = title;
  }

  data.caption = optionalText(input.caption, 'Caption', 300);
  data.videoUrl = mediaUrl(input.videoUrl, 'Video URL', !partial);

  if (input.posterUrl !== undefined) {
    data.posterUrl = input.posterUrl === null || input.posterUrl === ''
      ? null
      : mediaUrl(input.posterUrl, 'Poster URL', true) as string;
  }

  if (input.productLink !== undefined) {
    data.productLink = input.productLink === null || input.productLink === ''
      ? null
      : mediaUrl(input.productLink, 'Product link', true) as string;
  }

  if (!partial || input.isActive !== undefined) {
    if (input.isActive !== undefined && typeof input.isActive !== 'boolean') {
      throw new ReelValidationError('Published state must be true or false.');
    }
    data.isActive = input.isActive === undefined ? true : input.isActive;
  }

  if (!partial || input.order !== undefined) {
    const order = input.order === undefined ? 0 : Number(input.order);
    if (!Number.isInteger(order)) throw new ReelValidationError('Display order must be a whole number.');
    data.order = order;
  }

  return data;
}
