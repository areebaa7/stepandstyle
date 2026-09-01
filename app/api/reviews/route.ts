import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  try {
    const requestedPage = Math.max(1, Number(request.nextUrl.searchParams.get('page')) || 1);
    const total = await prisma.review.count({ where: { status: 'APPROVED' } });
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(requestedPage, totalPages);
    const reviews = await prisma.review.findMany({
      where: { status: 'APPROVED' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        rating: true,
        comment: true,
        userName: true,
        isVerifiedPurchase: true,
        isFeatured: true,
        images: true,
        videoUrl: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            image: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      reviews,
      pagination: { page, pageSize: PAGE_SIZE, total, totalPages },
    });
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
