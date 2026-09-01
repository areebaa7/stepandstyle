import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  getStoreCustomerId,
  sanitizeCartItems,
  sanitizePromoCode,
} from '@/lib/customerStore.server';

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Sign in with a customer account to sync your cart.' },
    { status: 401 },
  );
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getStoreCustomerId(request);
    if (!userId) return unauthorized();

    const cart = await prisma.customerCart.findUnique({ where: { userId } });
    return NextResponse.json({
      success: true,
      data: {
        items: sanitizeCartItems(cart?.items),
        promoCode: sanitizePromoCode(cart?.promoCode),
        promoAppliedAt: cart?.promoAppliedAt ?? null,
        updatedAt: cart?.updatedAt ?? null,
      },
    });
  } catch (error) {
    console.error('Error fetching customer cart:', error);
    return NextResponse.json({ success: false, error: 'Failed to load your cart.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getStoreCustomerId(request);
    if (!userId) return unauthorized();

    const body = await request.json();
    const items = sanitizeCartItems(body?.items);
    const promoCode = sanitizePromoCode(body?.promoCode);
    const requestedPromoAppliedAt = typeof body?.promoAppliedAt === 'string' ? new Date(body.promoAppliedAt) : null;
    const promoAppliedAt = promoCode && requestedPromoAppliedAt && !Number.isNaN(requestedPromoAppliedAt.getTime())
      ? requestedPromoAppliedAt
      : null;

    const cart = await prisma.customerCart.upsert({
      where: { userId },
      update: {
        items: items as Prisma.InputJsonValue,
        promoCode,
        promoAppliedAt,
      },
      create: {
        userId,
        items: items as Prisma.InputJsonValue,
        promoCode,
        promoAppliedAt,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: sanitizeCartItems(cart.items),
        promoCode: cart.promoCode,
        promoAppliedAt: cart.promoAppliedAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error saving customer cart:', error);
    return NextResponse.json({ success: false, error: 'Failed to save your cart.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getStoreCustomerId(request);
    if (!userId) return unauthorized();

    await prisma.customerCart.upsert({
      where: { userId },
      update: { items: [], promoCode: '', promoAppliedAt: null },
      create: { userId, items: [], promoCode: '', promoAppliedAt: null },
    });

    return NextResponse.json({ success: true, data: { items: [], promoCode: '', promoAppliedAt: null } });
  } catch (error) {
    console.error('Error clearing customer cart:', error);
    return NextResponse.json({ success: false, error: 'Failed to clear your cart.' }, { status: 500 });
  }
}
