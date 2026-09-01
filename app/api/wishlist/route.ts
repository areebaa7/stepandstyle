import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStoreCustomerId, sanitizeWishlistItems } from '@/lib/customerStore.server';

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Sign in with a customer account to sync your wishlist.' },
    { status: 401 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getStoreCustomerId(request);
    if (!userId) return unauthorized();

    const wishlist = await prisma.customerWishlist.findUnique({ where: { userId } });
    return NextResponse.json({
      success: true,
      data: {
        items: sanitizeWishlistItems(wishlist?.items),
        updatedAt: wishlist?.updatedAt ?? null,
      },
    });
  } catch (error) {
    console.error('Error fetching customer wishlist:', error);
    return NextResponse.json({ success: false, error: 'Failed to load your wishlist.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getStoreCustomerId(request);
    if (!userId) return unauthorized();

    const body = await request.json();
    const items = sanitizeWishlistItems(body?.items);
    const wishlist = await prisma.customerWishlist.upsert({
      where: { userId },
      update: { items: items as Prisma.InputJsonValue },
      create: { userId, items: items as Prisma.InputJsonValue },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: sanitizeWishlistItems(wishlist.items),
        updatedAt: wishlist.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error saving customer wishlist:', error);
    return NextResponse.json({ success: false, error: 'Failed to save your wishlist.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getStoreCustomerId(request);
    if (!userId) return unauthorized();

    await prisma.customerWishlist.upsert({
      where: { userId },
      update: { items: [] },
      create: { userId, items: [] },
    });

    return NextResponse.json({ success: true, data: { items: [] } });
  } catch (error) {
    console.error('Error clearing customer wishlist:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear your wishlist.' }, { status: 500 });
  }
}
