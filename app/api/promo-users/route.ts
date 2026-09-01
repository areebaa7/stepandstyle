import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

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

    const influencers = await prisma.influencerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            emailVerifiedAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: { promoCodes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: influencers,
      count: influencers.length,
    });
  } catch (error) {
    console.error('Error fetching promo users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch promo users.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Create influencer accounts from the Influencers section or approve an affiliate application.',
    },
    { status: 405 },
  );
}
