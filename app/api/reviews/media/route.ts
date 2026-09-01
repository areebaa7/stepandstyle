import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  void _request;
  try {
    // Fetch reviews that have at least one image or a videoUrl
    // We'll also include the product info so we can link back to it
    // Fetch recent reviews and filter for those with media in memory
    // (Prisma Json filtering on MongoDB can sometimes be inconsistent)
    const reviews = await prisma.review.findMany({
      where: { status: 'APPROVED' },
      select: {
        images: true,
        videoUrl: true,
        userName: true,
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Get a larger set then filter
    });

    const filteredReviews = reviews.filter(r => 
      (Array.isArray(r.images) && r.images.length > 0) || r.videoUrl
    );

    // Flatten and transform the data for the frontend
    const mediaItems = filteredReviews.flatMap(review => {
      const items: Array<{
        type: 'image' | 'video';
        url: string;
        productSlug: string;
        productName: string;
        userName: string;
      }> = [];
      
      if (Array.isArray(review.images)) {
        (review.images as string[]).forEach((img: string) => {
          items.push({
            type: 'image',
            url: img,
            productSlug: review.product.slug,
            productName: review.product.title,
            userName: review.userName,
          });
        });
      }
      
      if (review.videoUrl) {
        items.push({
          type: 'video',
          url: review.videoUrl,
          productSlug: review.product.slug,
          productName: review.product.title,
          userName: review.userName,
        });
      }
      
      return items;
    });

    return NextResponse.json({ success: true, media: mediaItems });
  } catch (error) {
    console.error('Failed to fetch review media:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch media' }, { status: 500 });
  }
}
