import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  void _request;
  try {
    const reviews = await prisma.review.findMany({
      where: {
        status: 'APPROVED',
        isFeatured: true,
      },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            image: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 15
    });

    // Map the results to match the expected format in the frontend
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      name: review.userName,
      rating: review.rating,
      comment: review.comment,
      productId: review.product?.slug || '',
      productName: review.product?.title || 'Unknown Product',
      productImage: review.product?.image || (Array.isArray(review.product?.images) ? review.product?.images[0] : null),
      date: new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    return NextResponse.json({ success: true, reviews: formattedReviews });
  } catch (error) {
    console.error('Failed to fetch featured reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch featured reviews' }, { status: 500 });
  }
}
