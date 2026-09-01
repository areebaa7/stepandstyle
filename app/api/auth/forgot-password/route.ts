import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/customerAccount';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const genericMessage = 'If an account exists for that email, a password reset link has been sent.';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const email = body && typeof body === 'object' && !Array.isArray(body)
      ? String((body as Record<string, unknown>).email || '').trim().toLowerCase()
      : '';

    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: true, message: genericMessage });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });

    if (user && user.role !== 'ADMIN') {
      await sendPasswordResetEmail(user).catch((error) => {
        console.error('Password reset email delivery failed:', error);
      });
    }

    return NextResponse.json({ success: true, message: genericMessage });
  } catch (error) {
    console.error('Forgot-password request failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to process the request.' }, { status: 500 });
  }
}
