import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { isAffiliateCommissionEligible, isAffiliateCommissionPending } from '@/lib/affiliateProgram';
import { getStorefrontSettings } from '@/lib/storefrontSettings.server';

type AnalyticsRange = '6m' | '12m' | 'all';

type InfluencerMetric = {
  influencerId: string;
  userId: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED';
  commissionRate: number;
  promoCodes: string[];
  attributedOrders: number;
  completedOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  attributedRevenue: number;
  completedRevenue: number;
  earnedCommission: number;
  pendingCommission: number;
  averageOrderValue: number;
  completionRate: number;
  lastSaleAt: Date | null;
};

type PromoCodeMetric = {
  id: string;
  code: string;
  influencerId: string;
  influencerName: string;
  attributedOrders: number;
  completedOrders: number;
  completedRevenue: number;
  earnedCommission: number;
};

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getRange(request: NextRequest): AnalyticsRange {
  const value = request.nextUrl.searchParams.get('range');
  return value === '6m' || value === 'all' ? value : '12m';
}

function getRangeStart(range: AnalyticsRange) {
  if (range === 'all') return null;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - (range === '6m' ? 5 : 11), 1);
}

async function requireAdmin(request: NextRequest) {
  const token =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ||
    request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ||
    null;
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  return payload?.role === 'ADMIN' ? payload : null;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const range = getRange(request);
    const rangeStart = getRangeStart(range);
    const orderWhere = rangeStart ? { createdAt: { gte: rangeStart } } : undefined;
    const { affiliateProgram } = await getStorefrontSettings();

    const [orders, profiles, totalProductsCount] = await Promise.all([
      prisma.order.findMany({
        where: orderWhere,
        include: {
          promoCode: {
            include: {
              influencer: {
                include: {
                  user: { select: { name: true, email: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.influencerProfile.findMany({
        include: {
          user: { select: { name: true, email: true } },
          promoCodes: { select: { id: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count(),
    ]);

    const uniqueCustomerEmails = new Set(orders.map((o) => o.shippingEmail.toLowerCase().trim()).filter(Boolean));
    const uniqueCustomersCount = uniqueCustomerEmails.size;

    const completedOrders = orders.filter((order) => order.status === 'COMPLETED');
    const openOrders = orders.filter(
      (order) => order.status !== 'COMPLETED' && order.status !== 'CANCELLED',
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const influencerMap = new Map<string, InfluencerMetric>();
    for (const profile of profiles) {
      influencerMap.set(profile.id, {
        influencerId: profile.id,
        userId: profile.userId,
        name: profile.user.name || 'Unnamed Influencer',
        email: profile.user.email,
        status: profile.status,
        commissionRate: toNumber(profile.commissionRate),
        promoCodes: profile.promoCodes.map((promoCode) => promoCode.code),
        attributedOrders: 0,
        completedOrders: 0,
        activeOrders: 0,
        cancelledOrders: 0,
        attributedRevenue: 0,
        completedRevenue: 0,
        earnedCommission: 0,
        pendingCommission: 0,
        averageOrderValue: 0,
        completionRate: 0,
        lastSaleAt: null,
      });
    }

    const promoCodeMap = new Map<string, PromoCodeMetric>();
    const attributedOrders = orders.filter((order) => order.promoCode?.influencer);

    for (const order of attributedOrders) {
      const influencer = order.promoCode?.influencer;
      const promoCode = order.promoCode;
      if (!influencer || !promoCode) continue;

      const metric = influencerMap.get(influencer.id);
      if (!metric) continue;

      const total = toNumber(order.total);
      const commission = total * metric.commissionRate;
      metric.attributedOrders += 1;
      metric.attributedRevenue += total;
      if (!metric.lastSaleAt || order.createdAt > metric.lastSaleAt) {
        metric.lastSaleAt = order.createdAt;
      }

      if (isAffiliateCommissionEligible(order.status, affiliateProgram)) {
        metric.completedOrders += 1;
        metric.completedRevenue += total;
        metric.earnedCommission += commission;
      } else if (order.status === 'CANCELLED') {
        metric.cancelledOrders += 1;
      } else if (isAffiliateCommissionPending(order.status, affiliateProgram)) {
        metric.activeOrders += 1;
        metric.pendingCommission += commission;
      }

      const codeMetric = promoCodeMap.get(promoCode.id) ?? {
        id: promoCode.id,
        code: promoCode.code,
        influencerId: influencer.id,
        influencerName: influencer.user.name || 'Unnamed Influencer',
        attributedOrders: 0,
        completedOrders: 0,
        completedRevenue: 0,
        earnedCommission: 0,
      };
      codeMetric.attributedOrders += 1;
      if (isAffiliateCommissionEligible(order.status, affiliateProgram)) {
        codeMetric.completedOrders += 1;
        codeMetric.completedRevenue += total;
        codeMetric.earnedCommission += commission;
      }
      promoCodeMap.set(promoCode.id, codeMetric);
    }

    const influencers = Array.from(influencerMap.values())
      .map((metric) => ({
        ...metric,
        averageOrderValue: metric.completedOrders
          ? metric.completedRevenue / metric.completedOrders
          : 0,
        completionRate: metric.attributedOrders
          ? (metric.completedOrders / metric.attributedOrders) * 100
          : 0,
      }))
      .sort(
        (left, right) =>
          right.completedRevenue - left.completedRevenue ||
          right.attributedOrders - left.attributedOrders,
      );

    const completedAttributedOrders = attributedOrders.filter((order) => isAffiliateCommissionEligible(order.status, affiliateProgram));
    const activeAttributedOrders = attributedOrders.filter((order) => isAffiliateCommissionPending(order.status, affiliateProgram));
    const attributedRevenue = completedAttributedOrders.reduce(
      (sum, order) => sum + toNumber(order.total),
      0,
    );
    const pendingAttributedRevenue = activeAttributedOrders.reduce(
      (sum, order) => sum + toNumber(order.total),
      0,
    );
    const earnedCommission = influencers.reduce(
      (sum, influencer) => sum + influencer.earnedCommission,
      0,
    );
    const pendingCommission = influencers.reduce(
      (sum, influencer) => sum + influencer.pendingCommission,
      0,
    );

    const earliestOrder = orders.at(-1)?.createdAt ?? new Date();
    let trendStart = rangeStart ?? startOfMonth(earliestOrder);
    const oldestVisibleMonth = new Date(today.getFullYear(), today.getMonth() - 35, 1);
    const trendIsLimited = range === 'all' && trendStart < oldestVisibleMonth;
    if (trendIsLimited) trendStart = oldestVisibleMonth;

    const trendMap = new Map<
      string,
      { key: string; label: string; orders: number; revenue: number; commission: number }
    >();
    const cursor = startOfMonth(trendStart);
    const lastMonth = startOfMonth(today);
    while (cursor <= lastMonth) {
      const key = monthKey(cursor);
      trendMap.set(key, {
        key,
        label: cursor.toLocaleDateString('en-PK', { month: 'short', year: '2-digit' }),
        orders: 0,
        revenue: 0,
        commission: 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const order of completedAttributedOrders) {
      const influencer = order.promoCode?.influencer;
      const bucket = trendMap.get(monthKey(order.createdAt));
      if (!influencer || !bucket) continue;
      const revenue = toNumber(order.total);
      bucket.orders += 1;
      bucket.revenue += revenue;
      bucket.commission += revenue * toNumber(influencer.commissionRate);
    }

    const grossRevenue = completedOrders.reduce(
      (sum, order) => sum + toNumber(order.subtotal),
      0,
    );
    const totalDiscounts = completedOrders.reduce(
      (sum, order) => sum + toNumber(order.discountAmount),
      0,
    );
    const grossProfit = grossRevenue - totalDiscounts;
    const ordersToday = completedOrders.filter((order) => order.createdAt >= today);
    const netProfitToday = ordersToday.reduce((sum, order) => {
      const commissionRate = toNumber(order.promoCode?.influencer?.commissionRate);
      const eligibleCommissionRate = isAffiliateCommissionEligible(order.status, affiliateProgram) ? commissionRate : 0;
      return sum + toNumber(order.total) * (1 - eligibleCommissionRate);
    }, 0);

    return NextResponse.json({
      success: true,
      data: {
        range,
        rangeStart,
        summary: {
          totalOrders: orders.length,
          completedOrders: completedOrders.length,
          pendingOrders: openOrders.length,
          uniqueCustomersCount,
          uniqueProductsCount: totalProductsCount,
          grossRevenue,
          totalDiscounts,
          grossProfit,
          totalCommission: earnedCommission,
          netRevenue: grossProfit - earnedCommission,
          ordersToday: ordersToday.length,
          netProfitToday,
        },
        influencerSummary: {
          totalInfluencers: profiles.length,
          activeInfluencers: profiles.filter((profile) => profile.status === 'ACTIVE').length,
          attributedOrders: attributedOrders.length,
          completedOrders: completedAttributedOrders.length,
          activeOrders: activeAttributedOrders.length,
          cancelledOrders: attributedOrders.filter((order) => order.status === 'CANCELLED').length,
          attributedRevenue,
          pendingAttributedRevenue,
          earnedCommission,
          pendingCommission,
          averageOrderValue: completedAttributedOrders.length
            ? attributedRevenue / completedAttributedOrders.length
            : 0,
          completionRate: attributedOrders.length
            ? (completedAttributedOrders.length / attributedOrders.length) * 100
            : 0,
          revenueShare: grossRevenue ? (attributedRevenue / grossRevenue) * 100 : 0,
        },
        trend: Array.from(trendMap.values()),
        trendIsLimited,
        influencers,
        topPromoCodes: Array.from(promoCodeMap.values())
          .sort((left, right) => right.completedRevenue - left.completedRevenue)
          .slice(0, 8),
        recentSales: attributedOrders.slice(0, 10).map((order) => ({
          id: order.id,
          influencerId: order.promoCode?.influencer?.id,
          influencerName: order.promoCode?.influencer?.user.name || 'Unnamed Influencer',
          promoCode: order.promoCode?.code,
          customerName: order.shippingName,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error building analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load analytics.' },
      { status: 500 },
    );
  }
}
