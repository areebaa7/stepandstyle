import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: true, user: null });
    }

    const payload = await verifyAuthToken(token);
    if (!payload) {
      const response = NextResponse.json({ success: true, user: null });
      response.cookies.set(AUTH_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return response;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      const response = NextResponse.json({ success: true, user: null });
      response.cookies.set(AUTH_COOKIE_NAME, '', { maxAge: 0, path: '/' });
      return response;
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        emailVerified: Boolean(user.emailVerifiedAt),
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ success: false, error: 'Unable to load account.' }, { status: 500 });
  }
}

