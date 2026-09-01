import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';

const MAX_SHIPPING_COST = 100_000;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ regionId: string }> }
) {
  try {
    const { regionId } = await context.params;
    const cities = await prisma.shippingCity.findMany({
      where: {
        regionId: regionId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ data: cities });
  } catch (error) {
    console.error('Failed to fetch cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ regionId: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { regionId } = await context.params;
    const body = await req.json();
    const { name } = body;
    const normalizedName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : '';

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      return NextResponse.json(
        { error: 'Enter a valid city name between 2 and 80 characters.' },
        { status: 400 }
      );
    }

    // Check if region exists
    const region = await prisma.shippingRegion.findUnique({
      where: { id: regionId },
    });

    if (!region) {
      return NextResponse.json(
        { error: 'Region not found' },
        { status: 404 }
      );
    }

    // Check for duplicate city in same region
    const existing = await prisma.shippingCity.findFirst({
      where: {
        name: normalizedName,
        regionId: regionId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'City already exists in this region' },
        { status: 400 }
      );
    }

    const city = await prisma.shippingCity.create({
      data: {
        name: normalizedName,
        regionId: regionId,
      },
    });

    return NextResponse.json({ data: city }, { status: 201 });
  } catch (error) {
    console.error('Failed to create city:', error);
    return NextResponse.json(
      { error: 'Failed to create city' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ regionId: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { regionId } = await context.params;
    const body = await req.json();
    const { shippingCost } = body;

    if (
      typeof shippingCost !== 'number' ||
      !Number.isFinite(shippingCost) ||
      shippingCost < 0 ||
      shippingCost > MAX_SHIPPING_COST
    ) {
      return NextResponse.json(
        { error: `Shipping cost must be between 0 and ${MAX_SHIPPING_COST}.` },
        { status: 400 }
      );
    }

    const updatedRegion = await prisma.shippingRegion.update({
      where: {
        id: regionId,
      },
      data: {
        shippingCost,
      },
      include: {
        cities: true
      }
    });

    return NextResponse.json({ data: updatedRegion });
  } catch (error) {
    console.error('Failed to update region cost:', error);
    return NextResponse.json(
      { error: 'Failed to update region cost' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ regionId: string }> }
) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { regionId } = await context.params;
    const { searchParams } = new URL(req.url);
    const cityId = searchParams.get('cityId');

    if (!cityId) {
      // Delete the entire region if no cityId provided
      await prisma.shippingCity.deleteMany({
        where: { regionId: regionId }
      });
      await prisma.shippingRegion.delete({
        where: { id: regionId }
      });
      return NextResponse.json({ success: true });
    }

    const result = await prisma.shippingCity.deleteMany({
      where: {
        id: cityId,
        regionId: regionId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete city:', error);
    return NextResponse.json(
      { error: 'Failed to delete city' },
      { status: 500 }
    );
  }
}
