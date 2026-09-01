import { NextResponse } from 'next/server';
import type { ReviewStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { verifyAdminRequest } from '@/lib/auth';
import { recalculateApprovedProductRating } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

const reviewStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;

async function requireAdmin(request: Request) {
  const admin = await verifyAdminRequest(request);
  return admin?.role === 'ADMIN' ? admin : null;
}

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reviews = await prisma.review.findMany({
      include: {
        product: { select: { title: true, slug: true } },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ data: reviews });
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const values = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
    const id = typeof values.id === 'string' ? values.id.trim() : '';
    const status = reviewStatuses.includes(values.status as typeof reviewStatuses[number])
      ? values.status as ReviewStatus
      : null;
    const hasFeaturedUpdate = typeof values.isFeatured === 'boolean';
    const moderationNote = typeof values.moderationNote === 'string'
      ? values.moderationNote.trim().slice(0, 1_000)
      : '';

    if (!id || (!status && !hasFeaturedUpdate)) {
      return NextResponse.json({ error: 'Review ID and a moderation update are required.' }, { status: 400 });
    }
    if (status === 'REJECTED' && moderationNote.length < 5) {
      return NextResponse.json({ error: 'Provide a rejection reason of at least 5 characters.' }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }
    const resultingStatus = status || existing.status;
    if (values.isFeatured === true && resultingStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'Only approved reviews can be featured.' }, { status: 409 });
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(status ? {
          status,
          moderatedAt: status === 'PENDING' ? null : new Date(),
          moderatedBy: status === 'PENDING' ? null : admin.userId,
          moderationNote: status === 'PENDING' ? null : moderationNote || null,
          ...(status !== 'APPROVED' ? { isFeatured: false } : {}),
        } : {}),
        ...(hasFeaturedUpdate ? { isFeatured: values.isFeatured as boolean } : {}),
      },
      include: { product: { select: { title: true, slug: true } } },
    });

    if (status && status !== existing.status) {
      await recalculateApprovedProductRating(existing.productId);
    }
    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error('Failed to moderate review:', error);
    return NextResponse.json({ error: 'Failed to update review moderation.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = new URL(request.url).searchParams.get('id')?.trim() || '';
    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
    }

    await prisma.review.delete({ where: { id } });
    if (existing.status === 'APPROVED') {
      await recalculateApprovedProductRating(existing.productId);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
