import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

const MAX_ITEMS = 100;

function cleanString(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanOptionalString(value: unknown, maxLength: number) {
  const cleaned = cleanString(value, maxLength);
  return cleaned || undefined;
}

function cleanPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : 0;
}

export async function getStoreCustomerId(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? await verifyAuthToken(token) : null;
  if (!payload || payload.role === 'ADMIN') return null;
  return payload.userId;
}

export function sanitizeCartItems(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.slice(0, MAX_ITEMS).flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const item = entry as Record<string, unknown>;
    const id = cleanString(item.id, 100);
    const title = cleanString(item.title, 200);
    if (!id || !title) return [];

    const quantityValue = Number(item.quantity);
    const quantity = Number.isFinite(quantityValue)
      ? Math.min(99, Math.max(1, Math.floor(quantityValue)))
      : 1;

    const image = cleanOptionalString(item.image, 1000);
    const size = cleanOptionalString(item.size, 50);
    const color = cleanOptionalString(item.color, 80);

    return [{
      id,
      title,
      price: cleanPrice(item.price),
      quantity,
      ...(image ? { image } : {}),
      ...(size ? { size } : {}),
      ...(color ? { color } : {}),
    }];
  });
}

export function sanitizeWishlistItems(value: unknown) {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value.slice(0, MAX_ITEMS).flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const item = entry as Record<string, unknown>;
    const id = cleanString(item.id, 100);
    const slug = cleanString(item.slug, 200);
    const title = cleanString(item.title, 200);
    const image = cleanString(item.image, 1000);
    if (!id || !slug || !title || !image || seen.has(id)) return [];
    seen.add(id);

    const salePrice = Number(item.salePrice);
    return [{
      id,
      slug,
      title,
      price: cleanPrice(item.price),
      ...(Number.isFinite(salePrice) && salePrice >= 0 ? { salePrice } : {}),
      image,
    }];
  });
}

export function sanitizePromoCode(value: unknown) {
  return typeof value === 'string'
    ? value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 40)
    : '';
}
