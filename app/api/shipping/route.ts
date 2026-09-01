import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import { DEFAULT_MANUAL_SHIPPING_COST } from '@/lib/shipping';

const MAX_SHIPPING_COST = 100_000;

export async function GET() {
  try {
    const regions = await prisma.shippingRegion.findMany({
      include: {
        cities: { orderBy: { name: 'asc' } },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      data: regions,
      meta: {
        manualFallbackEnabled: true,
        manualShippingCost: DEFAULT_MANUAL_SHIPPING_COST,
      },
    });
  } catch (error) {
    console.error('Failed to fetch shipping regions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping regions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, shippingCost } = body;
    const normalizedName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';
    const numericShippingCost = Number(shippingCost);

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      return NextResponse.json(
        { error: 'Enter a valid region name between 2 and 80 characters.' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(numericShippingCost) || numericShippingCost < 0 || numericShippingCost > MAX_SHIPPING_COST) {
      return NextResponse.json(
        { error: `Shipping cost must be between 0 and ${MAX_SHIPPING_COST}.` },
        { status: 400 },
      );
    }

    const region = await prisma.shippingRegion.create({
      data: { 
        name: normalizedName,
        shippingCost: numericShippingCost,
      },
      include: { cities: true },
    });

    return NextResponse.json({ data: region }, { status: 201 });
  } catch (error) {
    console.error('Failed to create region:', error);
    return NextResponse.json(
      { error: 'Failed to create region' },
      { status: 500 }
    );
  }
}
