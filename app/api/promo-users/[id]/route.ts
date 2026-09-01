import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { isAffiliateCommissionEligible, isAffiliateCommissionPending } from '@/lib/affiliateProgram';
import { getStorefrontSettings } from '@/lib/storefrontSettings.server';

async function requireAdmin(request: NextRequest) {
  const token =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ||
    null;
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  return payload?.role === 'ADMIN' ? payload : null;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function getInfluencerDetail(id: string) {
  const { affiliateProgram } = await getStorefrontSettings();
  const influencer = await prisma.influencerProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      promoCodes: {
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!influencer) return null;

  const application = await prisma.affiliateApplication.findFirst({
    where: { email: influencer.user.email },
    orderBy: { createdAt: 'desc' },
  });

  const attributedOrders = influencer.promoCodes
    .flatMap((promoCode) =>
      promoCode.orders.map((order) => ({
        ...order,
        promoCode: promoCode.code,
        promoCodeDiscount: promoCode.discountPercent,
      })),
    )
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

  const completedOrders = attributedOrders.filter((order) => isAffiliateCommissionEligible(order.status, affiliateProgram));
  const activeOrders = attributedOrders.filter((order) => isAffiliateCommissionPending(order.status, affiliateProgram));
  const completedRevenue = completedOrders.reduce(
    (sum, order) => sum + numberValue(order.total),
    0,
  );
  const attributedRevenue = attributedOrders.reduce(
    (sum, order) => sum + numberValue(order.total),
    0,
  );
  const totalDiscount = completedOrders.reduce(
    (sum, order) => sum + numberValue(order.discountAmount),
    0,
  );
  const earnedCommission = completedRevenue * numberValue(influencer.commissionRate);
  const pendingCommission = activeOrders.reduce(
    (sum, order) => sum + numberValue(order.total) * numberValue(influencer.commissionRate),
    0,
  );

  const today = new Date();
  const monthlyPerformance = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - offset), 1);
    const key = monthKey(date);
    const orders = completedOrders.filter((order) => monthKey(order.createdAt) === key);
    const revenue = orders.reduce((sum, order) => sum + numberValue(order.total), 0);
    return {
      key,
      label: date.toLocaleDateString('en-PK', { month: 'short', year: '2-digit' }),
      orders: orders.length,
      revenue,
      commission: revenue * numberValue(influencer.commissionRate),
    };
  });

  const promoCodes = influencer.promoCodes.map((promoCode) => {
    const completedCodeOrders = promoCode.orders.filter((order) => isAffiliateCommissionEligible(order.status, affiliateProgram));
    const revenue = completedCodeOrders.reduce(
      (sum, order) => sum + numberValue(order.total),
      0,
    );
    return {
      id: promoCode.id,
      code: promoCode.code,
      prefix: promoCode.prefix,
      discountPercent: promoCode.discountPercent,
      validUntil: promoCode.validUntil,
      usageCount: promoCode.usageCount,
      totalGrossSales: promoCode.totalGrossSales,
      totalDiscount: promoCode.totalDiscount,
      createdAt: promoCode.createdAt,
      updatedAt: promoCode.updatedAt,
      isExpired: promoCode.validUntil.getTime() < Date.now(),
      orderCount: promoCode.orders.length,
      completedOrderCount: completedCodeOrders.length,
      revenue,
      commission: revenue * numberValue(influencer.commissionRate),
    };
  });

  return {
    profile: {
      id: influencer.id,
      userId: influencer.userId,
      name: influencer.user.name,
      email: influencer.user.email,
      emailVerifiedAt: influencer.user.emailVerifiedAt,
      defaultPrefix: influencer.defaultPrefix,
      commissionRate: influencer.commissionRate,
      status: influencer.status,
      createdAt: influencer.createdAt,
      updatedAt: influencer.updatedAt,
      userCreatedAt: influencer.user.createdAt,
    },
    application: application
      ? {
          id: application.id,
          status: application.status,
          channelLink1: application.channelLink1,
          channelLink2: application.channelLink2,
          notes: application.notes,
          reviewedAt: application.reviewedAt,
          createdAt: application.createdAt,
        }
      : null,
    summary: {
      totalPromoCodes: promoCodes.length,
      activePromoCodes: promoCodes.filter((code) => !code.isExpired).length,
      totalOrders: attributedOrders.length,
      completedOrders: completedOrders.length,
      activeOrders: activeOrders.length,
      cancelledOrders: attributedOrders.filter((order) => order.status === 'CANCELLED').length,
      attributedRevenue,
      completedRevenue,
      totalDiscount,
      earnedCommission,
      pendingCommission,
      averageOrderValue: completedOrders.length ? completedRevenue / completedOrders.length : 0,
      completionRate: attributedOrders.length
        ? (completedOrders.length / attributedOrders.length) * 100
        : 0,
    },
    promoCodes,
    orders: attributedOrders.map((order) => ({
      id: order.id,
      promoCode: order.promoCode,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingCost: order.shippingCost,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      shippingName: order.shippingName,
      shippingEmail: order.shippingEmail,
      shippingCity: order.shippingCity,
      createdAt: order.createdAt,
      approvedAt: order.approvedAt,
      commissionEligible: isAffiliateCommissionEligible(order.status, affiliateProgram),
    })),
    monthlyPerformance,
    affiliateProgram,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;
    const data = await getInfluencerDetail(id);
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Influencer profile not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching influencer detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch influencer detail.' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;
    const existing = await prisma.influencerProfile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Influencer profile not found.' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const profileData: {
      status?: 'ACTIVE' | 'SUSPENDED';
      defaultPrefix?: string;
      commissionRate?: number;
    } = {};

    if (body.status !== undefined) {
      if (body.status !== 'ACTIVE' && body.status !== 'SUSPENDED') {
        return NextResponse.json(
          { success: false, error: 'Status must be ACTIVE or SUSPENDED.' },
          { status: 400 },
        );
      }
      profileData.status = body.status;
    }

    if (body.defaultPrefix !== undefined) {
      const prefix = String(body.defaultPrefix).trim().toUpperCase();
      if (!/^[A-Z0-9_]{2,20}$/.test(prefix)) {
        return NextResponse.json(
          { success: false, error: 'Prefix must be 2-20 letters, numbers, or underscores.' },
          { status: 400 },
        );
      }
      profileData.defaultPrefix = prefix;
    }

    if (body.commissionRate !== undefined) {
      const commissionRate = Number(body.commissionRate);
      if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) {
        return NextResponse.json(
          { success: false, error: 'Commission rate must be between 0 and 1.' },
          { status: 400 },
        );
      }
      profileData.commissionRate = commissionRate;
    }

    const name = body.name === undefined ? undefined : String(body.name).trim();
    if (body.name !== undefined && !name) {
      return NextResponse.json(
        { success: false, error: 'Name cannot be empty.' },
        { status: 400 },
      );
    }

    if (!Object.keys(profileData).length && name === undefined) {
      return NextResponse.json(
        { success: false, error: 'No valid changes were supplied.' },
        { status: 400 },
      );
    }

    if (Object.keys(profileData).length) {
      await prisma.influencerProfile.update({ where: { id }, data: profileData });
    }
    if (name !== undefined) {
      await prisma.user.update({ where: { id: existing.userId }, data: { name } });
    }

    return NextResponse.json({
      success: true,
      message: 'Influencer profile updated successfully.',
    });
  } catch (error) {
    console.error('Error updating influencer detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update influencer profile.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json(
    { success: false, error: 'Influencers must be suspended instead of deleted to preserve order history.' },
    { status: 405 },
  );
}
