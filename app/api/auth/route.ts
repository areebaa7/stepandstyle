import { after, NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, authCookieOptions, signAuthToken, type UserRole } from '@/lib/auth';
import { CUSTOMER_PASSWORD_REGEX, sendVerificationEmail } from '@/lib/customerAccount';
import {
  authRateLimitHeaders,
  consumeAuthRateLimit,
  getAuthClientAddress,
} from '@/lib/authRateLimit';
import { getStorefrontSettings } from '@/lib/storefrontSettings.server';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTRATION_WINDOW_MS = 60 * 60 * 1000;
const REGISTRATION_EMAIL_LIMIT = 3;
const REGISTRATION_IP_LIMIT = 20;

function rateLimited(decision: Awaited<ReturnType<typeof consumeAuthRateLimit>>) {
  return NextResponse.json(
    {
      success: false,
      code: 'AUTH_RATE_LIMITED',
      error: 'Too many registration attempts. Please wait before trying again.',
    },
    { status: 429, headers: authRateLimitHeaders(decision) },
  );
}

export async function POST(request: NextRequest) {
  try {
    const clientAddress = getAuthClientAddress(request);
    const ipLimit = await consumeAuthRateLimit({
      scope: 'register-ip',
      identifier: clientAddress,
      limit: REGISTRATION_IP_LIMIT,
      windowMs: REGISTRATION_WINDOW_MS,
    });
    if (!ipLimit.allowed) return rateLimited(ipLimit);

    const { email, password, name, wantsAdmin, wantsInfluencer, adminKey, defaultPrefix } = await request.json();

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailLimit = await consumeAuthRateLimit({
      scope: 'register-email',
      identifier: normalizedEmail,
      limit: REGISTRATION_EMAIL_LIMIT,
      windowMs: REGISTRATION_WINDOW_MS,
    });
    if (!emailLimit.allowed) return rateLimited(emailLimit);

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ success: false, error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!CUSTOMER_PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters and include letters and numbers.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists.' }, { status: 409 });
    }

    // Use environment variable for admin key
    const adminRegistrationKey = process.env.ADMIN_REGISTRATION_KEY?.trim();
    
    let role: UserRole = 'USER';
    if (wantsAdmin) {
      if (!adminKey) {
        return NextResponse.json({ success: false, error: 'Administrative key is required for admin registration.' }, { status: 400 });
      }

      if (!adminRegistrationKey || adminKey.trim() !== adminRegistrationKey) {
        return NextResponse.json({ success: false, error: 'Invalid administrative key.' }, { status: 403 });
      }
      role = 'ADMIN';
    } else if (wantsInfluencer) {
      const { affiliateProgram } = await getStorefrontSettings();
      if (!affiliateProgram.enabled) {
        return NextResponse.json({ success: false, error: 'New affiliate registrations are currently paused.' }, { status: 503 });
      }
      if (!defaultPrefix || !defaultPrefix.trim()) {
        return NextResponse.json({ success: false, error: 'Promo code prefix is required for influencer registration.' }, { status: 400 });
      }
      const prefix = defaultPrefix.trim().toUpperCase();
      if (!/^[A-Z0-9_]+$/.test(prefix)) {
        return NextResponse.json({ success: false, error: 'Prefix can only contain letters, numbers, and underscores.' }, { status: 400 });
      }
      role = 'INFLUENCER';
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        password: hashedPassword,
        role,
        adminKeyUsed: role === 'ADMIN',
      },
    });

    // Create influencer profile if registering as influencer
    if (role === 'INFLUENCER' && defaultPrefix) {
      const { affiliateProgram } = await getStorefrontSettings();
      await prisma.influencerProfile.create({
        data: {
          userId: user.id,
          defaultPrefix: defaultPrefix.trim().toUpperCase(),
          commissionRate: affiliateProgram.defaultCommissionPercent / 100,
        },
      });
    }

    if (role === 'USER') {
      after(async () => {
        await sendVerificationEmail(user).catch((error) => {
          console.error('Verification email setup failed after registration:', error);
        });
      });
    }

    const token = await signAuthToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: false,
      },
      verificationEmailQueued: role === 'USER',
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);
    return response;
  } catch (error) {
    console.error('Error registering user:', error);

    if (error instanceof Error && error.name === 'PrismaClientInitializationError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Database is unavailable. Check the MongoDB connection and DATABASE_URL.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: false, error: 'Failed to register user.' }, { status: 500 });
  }
}

// You can also create separate routes for login:
// POST /api/auth/login
// POST /api/auth/logout
// GET /api/auth/me (get current user)

