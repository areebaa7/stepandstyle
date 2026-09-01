import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { getStorefrontSettings } from '@/lib/storefrontSettings.server';

async function requireAdmin(request: NextRequest) {
  const token =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return null;
  }

  return payload;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const influencers = await prisma.influencerProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            promoCodes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, influencers });
  } catch (error) {
    console.error('Failed to fetch influencers:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch influencers.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, defaultPrefix, commissionRate } = body;

    if (!name || !email || !password || !defaultPrefix) {
      return NextResponse.json(
        { success: false, error: 'Name, email, password, and default prefix are required.' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const prefix = defaultPrefix.trim().toUpperCase();
    const { affiliateProgram } = await getStorefrontSettings();
    const commissionValue = Number(commissionRate ?? affiliateProgram.defaultCommissionPercent / 100);

    if (!/^[A-Z0-9_]+$/.test(prefix)) {
      return NextResponse.json(
        { success: false, error: 'Prefix can only contain letters, numbers, and underscores.' },
        { status: 400 },
      );
    }

    if (!Number.isFinite(commissionValue) || commissionValue < 0 || commissionValue > 1) {
      return NextResponse.json(
        { success: false, error: 'Commission rate must be between 0 and 1.' },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists.' },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        password: hashedPassword,
        role: 'INFLUENCER',
      },
    });

    // Create influencer profile
    const influencer = await prisma.influencerProfile.create({
      data: {
        userId: user.id,
        defaultPrefix: prefix,
        commissionRate: commissionValue,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, influencer }, { status: 201 });
  } catch (error) {
    console.error('Failed to create influencer:', error);
    return NextResponse.json({ success: false, error: 'Failed to create influencer.' }, { status: 500 });
  }
}



