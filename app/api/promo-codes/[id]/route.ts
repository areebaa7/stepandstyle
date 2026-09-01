import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

async function requireAdmin(request: NextRequest) {
  const token =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;

  return payload;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.promoCode.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Promo code not found.' }, { status: 404 });
    }

    const data: { discountPercent?: number; validUntil?: Date; usageLimit?: number | null } = {};

    if (body.discountPercent !== undefined) {
      const discountValue = Number(body.discountPercent);
      if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
        return NextResponse.json(
          { success: false, error: 'Discount percentage must be a number between 1 and 100.' },
          { status: 400 },
        );
      }
      data.discountPercent = Math.round(discountValue);
    }

    if (body.validUntil !== undefined && body.validUntil !== null && body.validUntil !== '') {
      const expiryDate = new Date(body.validUntil);
      if (Number.isNaN(expiryDate.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid validity date supplied.' }, { status: 400 });
      }
      data.validUntil = expiryDate;
    }

    if (body.usageLimit !== undefined) {
      if (body.usageLimit === null || body.usageLimit === '') {
        data.usageLimit = null;
      } else {
        const limitValue = Number(body.usageLimit);
        if (!Number.isFinite(limitValue) || limitValue < 1) {
          return NextResponse.json(
            { success: false, error: 'Usage limit must be a positive number, or empty for unlimited.' },
            { status: 400 },
          );
        }
        data.usageLimit = Math.round(limitValue);
      }
    }

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data,
      include: {
        influencer: {
          select: {
            id: true,
            defaultPrefix: true,
            commissionRate: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, code: promoCode });
  } catch (error) {
    console.error('Failed to update promo code:', error);
    return NextResponse.json({ success: false, error: 'Failed to update promo code.' }, { status: 500 });
  }
}