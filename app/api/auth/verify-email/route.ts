import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { findValidCustomerToken } from '@/lib/customerAccount';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawToken = url.searchParams.get('token') || '';
  const destination = new URL('/verify-email', url.origin);

  try {
    const accountToken = await findValidCustomerToken(rawToken, 'EMAIL_VERIFICATION');
    if (!accountToken || accountToken.user.role !== 'USER') {
      destination.searchParams.set('status', 'invalid');
      return NextResponse.redirect(destination);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: accountToken.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.order.updateMany({
        where: {
          userId: null,
          shippingEmail: accountToken.user.email,
        },
        data: { userId: accountToken.userId },
      }),
      prisma.accountToken.deleteMany({
        where: { userId: accountToken.userId, type: 'EMAIL_VERIFICATION' },
      }),
    ]);

    destination.searchParams.set('status', 'success');
    return NextResponse.redirect(destination);
  } catch (error) {
    console.error('Email verification failed:', error);
    destination.searchParams.set('status', 'error');
    return NextResponse.redirect(destination);
  }
}
