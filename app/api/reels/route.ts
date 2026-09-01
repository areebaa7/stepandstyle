import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';
import { normalizeReelData, ReelValidationError } from '@/lib/reelValidation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get('isActive') === 'true';

    if (!publishedOnly && !(await isAdminRequest(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const reels = await prisma.homeReel.findMany({
      where: publishedOnly ? { isActive: true } : undefined,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, reels });
  } catch (error) {
    console.error('Error fetching reels:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reels.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const data = normalizeReelData(await request.json());
    const reel = await prisma.homeReel.create({
      data: {
        category: data.category!,
        title: data.title!,
        caption: data.caption ?? null,
        videoUrl: data.videoUrl!,
        posterUrl: data.posterUrl ?? null,
        productLink: data.productLink ?? null,
        isActive: data.isActive!,
        order: data.order!,
      },
    });

    return NextResponse.json({ success: true, reel }, { status: 201 });
  } catch (error) {
    const validationError = error instanceof ReelValidationError;
    console.error('Error creating reel:', error);
    return NextResponse.json(
      { success: false, error: validationError ? error.message : 'Failed to create reel.' },
      { status: validationError ? 400 : 500 },
    );
  }
}
