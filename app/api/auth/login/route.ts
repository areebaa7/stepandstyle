import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, authCookieOptions, signAuthToken } from '@/lib/auth';
import {
  authRateLimitHeaders,
  clearAuthRateLimit,
  consumeAuthRateLimit,
  getAuthClientAddress,
} from '@/lib/authRateLimit';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_EMAIL_LIMIT = 5;
const LOGIN_IP_LIMIT = 50;

function rateLimited(decision: Awaited<ReturnType<typeof consumeAuthRateLimit>>) {
  return NextResponse.json(
    {
      success: false,
      code: 'AUTH_RATE_LIMITED',
      error: 'Too many login attempts. Please wait before trying again.',
    },
    { status: 429, headers: authRateLimitHeaders(decision) },
  );
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const clientAddress = getAuthClientAddress(request);
    const ipLimit = await consumeAuthRateLimit({
      scope: 'login-ip',
      identifier: clientAddress,
      limit: LOGIN_IP_LIMIT,
      windowMs: LOGIN_WINDOW_MS,
    });
    if (!ipLimit.allowed) return rateLimited(ipLimit);

    const emailLimit = await consumeAuthRateLimit({
      scope: 'login-email',
      identifier: normalizedEmail,
      limit: LOGIN_EMAIL_LIMIT,
      windowMs: LOGIN_WINDOW_MS,
    });
    if (!emailLimit.allowed) return rateLimited(emailLimit);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { influencerProfile: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ success: false, error: 'Invalid credentials.' }, { status: 401 });
    }

    if (user.role === 'INFLUENCER') {
      const latestApplication = await prisma.affiliateApplication.findFirst({
        where: { email: user.email },
        orderBy: { createdAt: 'desc' },
      });
      const applicationBlocksAccess = latestApplication && latestApplication.status !== 'APPROVED';
      if (!user.influencerProfile || user.influencerProfile.status !== 'ACTIVE' || applicationBlocksAccess) {
        return NextResponse.json(
          { success: false, error: 'Your influencer account is not active. Please wait for approval or contact support.' },
          { status: 403 },
        );
      }
    }

    const token = await signAuthToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
    await clearAuthRateLimit('login-email', normalizedEmail);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: Boolean(user.emailVerifiedAt),
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);
    return response;
  } catch (error) {
    console.error('Error logging in:', error);

    if (error instanceof Error && error.name === 'PrismaClientInitializationError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Database is unavailable. Check the MongoDB connection and DATABASE_URL.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: false, error: 'Failed to login.' }, { status: 500 });
  }
}


