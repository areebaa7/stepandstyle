import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const activeEvents = await prisma.saleEvent.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeEvents.length) {
      return NextResponse.json({ show: false, events: [] });
    }

    // 2. Count products covered by the active events
    const targetIds = new Set<string>();
    for (const event of activeEvents) {
      const targetCollections = (event.targetCollections as string[]) || [];
      const targetProducts = (event.targetProducts as string[]) || [];

      if (targetCollections.length > 0) {
        const products = await prisma.product.findMany({
          where: { collectionId: { in: targetCollections } },
          select: { id: true },
        });
        for (const product of products) targetIds.add(product.id);
      }
      for (const id of targetProducts) targetIds.add(id);
    }

    // Logic: Show if more than 10 products have discounts,
    // or if active events cover at least one product.
    const shouldShow = targetIds.size > 10 || (activeEvents.length > 0 && targetIds.size > 0);

    const events = activeEvents.map((event) => ({
      id: event.id,
      eventName: event.name,
      bannerText: event.bannerText,
      discountPercent: event.discountPercent,
    }));

    return NextResponse.json({
      show: shouldShow,
      bannerText: events[0]?.bannerText,
      eventName: events[0]?.eventName,
      count: targetIds.size,
      discountPercent: Math.max(...events.map((e) => Number(e.discountPercent) || 0)),
      events,
    });
  } catch {
    return NextResponse.json({ show: false, events: [] });
  }
}
