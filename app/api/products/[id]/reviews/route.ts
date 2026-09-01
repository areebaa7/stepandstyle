import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerFromRequest } from '@/lib/customerAccount';
import {
  authRateLimitHeaders,
  consumeAuthRateLimit,
  getAuthClientAddress,
} from '@/lib/authRateLimit';
import {
  customerPurchasedProduct,
  customerReviewId,
  parseReviewSubmission,
} from '@/lib/reviews';

const REVIEW_IP_LIMIT = 20;
const REVIEW_IP_WINDOW_MS = 60 * 60 * 1000;
const REVIEW_USER_LIMIT = 5;
const REVIEW_USER_WINDOW_MS = 24 * 60 * 60 * 1000;

const publicReviewSelect = {
  id: true,
  rating: true,
  comment: true,
  userName: true,
  productId: true,
  isVerifiedPurchase: true,
  isFeatured: true,
  images: true,
  videoUrl: true,
  createdAt: true,
} as const;

function rateLimited(decision: Awaited<ReturnType<typeof consumeAuthRateLimit>>) {
  return NextResponse.json(
    {
      success: false,
      code: 'REVIEW_RATE_LIMITED',
      error: 'Too many review submissions. Please wait before trying again.',
    },
    { status: 429, headers: authRateLimitHeaders(decision) },
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: slug } = await context.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId: product.id, status: 'APPROVED' },
      select: publicReviewSelect,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json(
        { success: false, code: 'CUSTOMER_AUTH_REQUIRED', error: 'Sign in with a customer account to submit a review.' },
        { status: 401 },
      );
    }
    if (!customer.emailVerifiedAt) {
      return NextResponse.json(
        { success: false, code: 'EMAIL_VERIFICATION_REQUIRED', error: 'Verify your email before submitting a review.' },
        { status: 403 },
      );
    }

    const ipLimit = await consumeAuthRateLimit({
      scope: 'review-ip',
      identifier: getAuthClientAddress(request),
      limit: REVIEW_IP_LIMIT,
      windowMs: REVIEW_IP_WINDOW_MS,
    });
    if (!ipLimit.allowed) return rateLimited(ipLimit);
    const userLimit = await consumeAuthRateLimit({
      scope: 'review-user',
      identifier: customer.id,
      limit: REVIEW_USER_LIMIT,
      windowMs: REVIEW_USER_WINDOW_MS,
    });
    if (!userLimit.allowed) return rateLimited(userLimit);

    const parsed = parseReviewSubmission(await request.json());
    if ('error' in parsed) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    const { id: slug } = await context.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const id = customerReviewId(customer.id, product.id);
    const existing = await prisma.review.findUnique({ where: { id } });
    if (existing && existing.status !== 'REJECTED') {
      return NextResponse.json(
        {
          success: false,
          code: 'REVIEW_ALREADY_SUBMITTED',
          error: existing.status === 'PENDING'
            ? 'Your review is already waiting for moderation.'
            : 'You have already reviewed this product.',
        },
        { status: 409 },
      );
    }

    const isVerifiedPurchase = await customerPurchasedProduct(customer.id, product.id);
    const reviewData = {
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      userName: customer.name || 'Step & Styl customer',
      userEmail: customer.email,
      userId: customer.id,
      productId: product.id,
      status: 'PENDING' as const,
      isVerifiedPurchase,
      isFeatured: false,
      images: parsed.data.images as Prisma.InputJsonValue,
      videoUrl: parsed.data.videoUrl,
      moderatedAt: null,
      moderatedBy: null,
      moderationNote: null,
    };

    const review = existing
      ? await prisma.review.update({ where: { id }, data: reviewData })
      : await prisma.review.create({ data: { id, ...reviewData } });

    return NextResponse.json(
      {
        success: true,
        pendingModeration: true,
        message: 'Your review was submitted and is waiting for moderation.',
        review: { id: review.id, status: review.status },
      },
      { status: 202 },
    );
  } catch (error) {
    console.error('Failed to create review:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit review' }, { status: 500 });
  }
}
