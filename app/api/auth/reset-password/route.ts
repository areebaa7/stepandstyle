import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CUSTOMER_PASSWORD_REGEX, findValidCustomerToken } from '@/lib/customerAccount';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const values = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
    const token = typeof values.token === 'string' ? values.token : '';
    const password = typeof values.password === 'string' ? values.password : '';

    if (!CUSTOMER_PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters and include letters and numbers.' },
        { status: 400 },
      );
    }

    const accountToken = await findValidCustomerToken(token, 'PASSWORD_RESET');
    if (!accountToken || !['USER', 'INFLUENCER'].includes(accountToken.user.role)) {
      return NextResponse.json(
        { success: false, error: 'This password reset link is invalid or has expired.' },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: accountToken.userId },
        data: { password: hashedPassword, emailVerifiedAt: new Date() },
      }),
      prisma.accountToken.deleteMany({
        where: { userId: accountToken.userId, type: 'PASSWORD_RESET' },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password reset failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to reset the password.' }, { status: 500 });
  }
}
