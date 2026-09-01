import { createHash } from 'node:crypto';
import prisma from '@/lib/prisma';

const MAX_REVIEW_IMAGES = 4;
const MAX_MEDIA_URL_LENGTH = 1_000;
const MIN_COMMENT_LENGTH = 20;
const MAX_COMMENT_LENGTH = 2_000;

function parseHttpsUrl(value: unknown) {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw || raw.length > MAX_MEDIA_URL_LENGTH) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function parseVideoUrl(value: unknown) {
  if (value === null || value === undefined || value === '') return { success: true, value: null } as const;
  const normalized = parseHttpsUrl(value);
  if (!normalized) return { success: false, error: 'Video URL must be a valid HTTPS YouTube link.' } as const;
  const hostname = new URL(normalized).hostname.toLowerCase();
  if (!['youtube.com', 'www.youtube.com', 'youtu.be'].includes(hostname)) {
    return { success: false, error: 'Only HTTPS YouTube video links are supported.' } as const;
  }
  return { success: true, value: normalized } as const;
}

export function parseReviewSubmission(body: unknown) {
  const values = body && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {};
  const rating = Number(values.rating);
  const comment = typeof values.comment === 'string'
    ? values.comment.trim().replace(/\0/g, '')
    : '';

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating must be a whole number between 1 and 5.' } as const;
  }
  if (comment.length < MIN_COMMENT_LENGTH || comment.length > MAX_COMMENT_LENGTH) {
    return { error: `Review must be between ${MIN_COMMENT_LENGTH} and ${MAX_COMMENT_LENGTH} characters.` } as const;
  }

  const rawImages = values.images === undefined ? [] : values.images;
  if (!Array.isArray(rawImages) || rawImages.length > MAX_REVIEW_IMAGES) {
    return { error: `You can attach up to ${MAX_REVIEW_IMAGES} image URLs.` } as const;
  }
  const images = rawImages.map(parseHttpsUrl);
  if (images.some((image) => !image)) {
    return { error: 'Every review image must be a valid HTTPS URL.' } as const;
  }

  const video = parseVideoUrl(values.videoUrl);
  if (!video.success) return { error: video.error } as const;

  return {
    data: {
      rating,
      comment,
      images: images as string[],
      videoUrl: video.value,
    },
  } as const;
}

export function customerReviewId(userId: string, productId: string) {
  const digest = createHash('sha256').update(`${userId}:${productId}`).digest('hex');
  return `review_${digest}`;
}

export async function customerPurchasedProduct(userId: string, productId: string) {
  const orders = await prisma.order.findMany({
    where: { userId, status: 'COMPLETED' },
    select: { items: true },
  });
  return orders.some((order) => Array.isArray(order.items) && order.items.some((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
    return (entry as Record<string, unknown>).id === productId;
  }));
}

export async function recalculateApprovedProductRating(productId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { productId, status: 'APPROVED' },
    _avg: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: { rating: aggregate._avg.rating ?? 0 },
  });
}
