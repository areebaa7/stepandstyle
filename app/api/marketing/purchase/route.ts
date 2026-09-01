import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { purchaseEventId, verifyPurchaseClaim } from '@/lib/purchaseTracking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { orderId?: unknown; token?: unknown };
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    if (!orderId || !token || !await verifyPurchaseClaim(token, orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid or expired purchase claim.' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, total: true, items: true },
    });
    if (!order) return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });

    const items = Array.isArray(order.items) ? order.items : [];
    const contentIds = items.flatMap((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
      const id = (entry as Record<string, unknown>).id;
      return typeof id === 'string' && id ? [id] : [];
    });
    const numItems = items.reduce<number>((total, entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return total;
      const quantity = Number((entry as Record<string, unknown>).quantity);
      return total + (Number.isInteger(quantity) && quantity > 0 ? quantity : 0);
    }, 0);

    const claim = await prisma.$runCommandRaw({
      findAndModify: 'MarketingEvent',
      query: { _id: purchaseEventId(orderId), eventName: 'Purchase', browserDispatchedAt: null },
      update: { $set: { browserDispatchedAt: new Date() } },
      new: true,
    });
    const claimValue = claim && typeof claim === 'object' && !Array.isArray(claim)
      ? (claim as Record<string, unknown>).value
      : null;

    return NextResponse.json({
      success: true,
      shouldTrack: Boolean(claimValue),
      data: { eventId: purchaseEventId(orderId), orderId, value: order.total, currency: 'PKR', numItems, contentIds },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Purchase conversion claim failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to verify purchase conversion.' }, { status: 500 });
  }
}
