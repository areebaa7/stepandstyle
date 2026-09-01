import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'Promo code is required.' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: normalizedCode },
      include: {
        influencer: {
          select: {
            id: true,
            status: true,
            user: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!promoCode) {
      return NextResponse.json({ success: false, error: 'Invalid promo code.' }, { status: 404 });
    }

    const now = new Date();
    if (new Date(promoCode.validUntil) < now) {
      return NextResponse.json({ success: false, error: 'Promo code has expired.' }, { status: 400 });
    }

    if (promoCode.usageLimit !== null && promoCode.usageCount >= promoCode.usageLimit) {
      return NextResponse.json(
        { success: false, error: 'This promo code has reached its usage limit and is no longer available.' },
        { status: 400 },
      );
    }

    if (promoCode.influencer) {
      const latestApplication = await prisma.affiliateApplication.findFirst({
        where: { email: promoCode.influencer.user.email },
        orderBy: { createdAt: 'desc' },
      });
      const applicationBlocksCode = latestApplication && latestApplication.status !== 'APPROVED';
      if (promoCode.influencer.status !== 'ACTIVE' || applicationBlocksCode) {
        return NextResponse.json({ success: false, error: 'Promo code is not available.' }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      code: {
        id: promoCode.id,
        code: promoCode.code,
        discountPercent: promoCode.discountPercent,
        validUntil: promoCode.validUntil,
      },
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json({ success: false, error: 'Failed to validate promo code.' }, { status: 500 });
  }
}

