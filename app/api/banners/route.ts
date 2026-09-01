import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';
import { BannerValidationError, BANNER_CATEGORIES, normalizeBannerData } from '@/lib/bannerValidation';
import type { BannerCategory } from '@/types/banner';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    if (category && !BANNER_CATEGORIES.includes(category as BannerCategory)) {
      return NextResponse.json(
        { success: false, error: 'Invalid banner category.' },
        { status: 400 }
      );
    }

    if (isActive !== null && isActive !== 'true' && isActive !== 'false') {
      return NextResponse.json(
        { success: false, error: 'isActive must be true or false.' },
        { status: 400 }
      );
    }

    // Public callers may only request currently publishable banners. The
    // unfiltered listing used by Banner Manager is admin-only.
    if (isActive !== 'true' && !(await isAdminRequest(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (isActive === 'true') {
      const now = new Date();
      where.AND = [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ];
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ success: true, banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = normalizeBannerData(await request.json());

    const newBanner = await prisma.banner.create({
      data: {
        category: data.category!,
        desktopImageUrl: data.desktopImageUrl!,
        mobileImageUrl: data.mobileImageUrl!,
        desktopImageSlot: data.desktopImageSlot!,
        mobileImageSlot: data.mobileImageSlot!,
        title: data.title ?? null,
        subtitle: data.subtitle ?? null,
        textPosition: data.textPosition!,
        ctaText: data.ctaText ?? null,
        ctaLink: data.ctaLink ?? null,
        isActive: data.isActive!,
        order: data.order!,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
      },
    });

    return NextResponse.json({ success: true, banner: newBanner }, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    const isValidationError = error instanceof BannerValidationError;
    return NextResponse.json(
      {
        success: false,
        error: isValidationError ? error.message : 'Failed to create banner',
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
