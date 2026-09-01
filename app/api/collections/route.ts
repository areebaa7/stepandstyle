import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, collections });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch collections' }, { status: 500 });
  }
}

import { sendMarketingEmails, buildPromoEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const payload = token ? await verifyAuthToken(token) : null;
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, slug, description, image, targetGender, sendPromoEmail } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'Name and slug are required' }, { status: 400 });
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        description,
        image,
        targetGender: targetGender || 'UNISEX',
      },
    });

    if (sendPromoEmail) {
      const subscribers = await prisma.newsletterSubscriber.findMany({
        where: { status: 'SUBSCRIBED' },
        select: { email: true, unsubscribeToken: true },
      });
      
      if (subscribers.length > 0) {
        const html = buildPromoEmail(
          'New Collection Alert!',
          `We just launched a brand new collection: <strong>${collection.name}</strong>. Explore the latest additions now!`,
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/collections/${collection.slug}`,
          'Shop Collection'
        );
        sendMarketingEmails({
          recipients: subscribers,
          subject: `New Collection: ${collection.name}`,
          html,
        }).catch(err => console.error('Background promo email error:', err));
      }
    }

    return NextResponse.json({ success: true, collection });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json({ success: false, error: 'Failed to create collection' }, { status: 500 });
  }
}
