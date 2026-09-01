import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export type AuthRateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

function rateLimitKey(scope: string, identifier: string) {
  const digest = createHash('sha256').update(identifier).digest('hex');
  return `${scope}:${digest}`;
}

export function getAuthClientAddress(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const candidate = request.headers.get('cf-connecting-ip')?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    forwarded ||
    'unknown';
  return candidate.slice(0, 128).toLowerCase();
}

export async function consumeAuthRateLimit({
  scope,
  identifier,
  limit,
  windowMs,
}: {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
}): Promise<AuthRateLimitDecision> {
  const key = rateLimitKey(scope, identifier);
  const result = await prisma.$runCommandRaw({
    findAndModify: 'AuthRateLimit',
    query: { _id: key },
    update: [
      {
        $set: {
          count: {
            $cond: [
              { $gt: ['$expiresAt', '$$NOW'] },
              { $add: [{ $ifNull: ['$count', 0] }, 1] },
              1,
            ],
          },
          windowStartedAt: {
            $cond: [
              { $gt: ['$expiresAt', '$$NOW'] },
              { $ifNull: ['$windowStartedAt', '$$NOW'] },
              '$$NOW',
            ],
          },
          expiresAt: {
            $cond: [
              { $gt: ['$expiresAt', '$$NOW'] },
              '$expiresAt',
              { $dateAdd: { startDate: '$$NOW', unit: 'millisecond', amount: windowMs } },
            ],
          },
          createdAt: { $ifNull: ['$createdAt', '$$NOW'] },
          updatedAt: '$$NOW',
        },
      },
    ],
    upsert: true,
    new: true,
  } as Prisma.InputJsonObject);

  const value = result && typeof result === 'object' && !Array.isArray(result)
    ? (result as Record<string, unknown>).value
    : null;
  const record = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
  const count = Number(record?.count);
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('Authentication rate-limit state could not be loaded.');
  }

  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(1, Math.ceil(windowMs / 1000)),
  };
}

export async function clearAuthRateLimit(scope: string, identifier: string) {
  await prisma.authRateLimit.deleteMany({
    where: { key: rateLimitKey(scope, identifier) },
  });
}

export function authRateLimitHeaders(decision: AuthRateLimitDecision) {
  return {
    'Retry-After': String(decision.retryAfterSeconds),
    'RateLimit-Limit': String(decision.limit),
    'RateLimit-Remaining': String(decision.remaining),
    'RateLimit-Reset': String(decision.retryAfterSeconds),
  };
}
