import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAffiliateCommissionEligible } from '@/lib/affiliateProgram';
import { getStorefrontSettings } from '@/lib/storefrontSettings.server';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

async function requireInfluencer(request: NextRequest) {
  const token =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);
  if (!payload || payload.role !== 'INFLUENCER') {
    return null;
  }

  return payload;
}

export async function GET(request: NextRequest) {
  try {
    const { affiliateProgram } = await getStorefrontSettings();
    const influencerUser = await requireInfluencer(request);
    if (!influencerUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const profile = await prisma.influencerProfile.findUnique({
      where: { userId: influencerUser.userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    const latestApplication = await prisma.affiliateApplication.findFirst({
      where: { email: profile.user.email },
      orderBy: { createdAt: 'desc' },
    });
    const applicationBlocksAccess = latestApplication && latestApplication.status !== 'APPROVED';
    if (profile.status !== 'ACTIVE' || applicationBlocksAccess) {
      return NextResponse.json(
        { success: false, error: 'Your influencer account is not active.' },
        { status: 403 },
      );
    }

    const promoCodes = await prisma.promoCode.findMany({
      where: {
        influencerId: profile.id,
        validUntil: { gte: new Date() },
      },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const orders = await prisma.order.findMany({
      where: {
        promoCode: {
          influencerId: profile.id,
        },
      },
      include: {
        promoCode: {
          select: {
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const eligibleOrders = orders.filter((order) => isAffiliateCommissionEligible(order.status, affiliateProgram));
    const grossSales = eligibleOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalDiscount = eligibleOrders.reduce((sum, order) => sum + Number(order.discountAmount), 0);
    const totalOrders = eligibleOrders.length;
    const estimatedCommission = grossSales * Number(profile.commissionRate);

    return NextResponse.json({
      success: true,
      profile,
      metrics: {
        totalOrders,
        grossSales,
        totalDiscount,
        estimatedCommission,
        promoCodeCount: promoCodes.length,
      },
      promoCodes,
      orders: orders.map((order) => ({
        ...order,
        commissionEligible: isAffiliateCommissionEligible(order.status, affiliateProgram),
      })),
      affiliateProgram,
    });
  } catch (error) {
    console.error('Failed to load influencer dashboard:', error);
    return NextResponse.json({ success: false, error: 'Failed to load dashboard.' }, { status: 500 });
  }
}


