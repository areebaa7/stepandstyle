import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, authCookieOptions } from '@/lib/auth';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.set(AUTH_COOKIE_NAME, '', {
      ...authCookieOptions,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ success: false, error: 'Failed to logout.' }, { status: 500 });
  }
}

