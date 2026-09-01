import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, authCookieOptions, signAuthToken } from '@/lib/auth';
import { getCustomerFromRequest, sendVerificationEmail } from '@/lib/customerAccount';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(request: Request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const values = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
    const name = typeof values.name === 'string' ? values.name.trim() : '';
    const email = typeof values.email === 'string' ? values.email.trim().toLowerCase() : '';
    const currentPassword = typeof values.currentPassword === 'string' ? values.currentPassword : '';

    if (!name || name.length > 100) {
      return NextResponse.json({ success: false, error: 'Please provide a valid name.' }, { status: 400 });
    }
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const emailChanged = email !== customer.email;
    if (emailChanged) {
      if (!currentPassword || !(await bcrypt.compare(currentPassword, customer.password))) {
        return NextResponse.json(
          { success: false, error: 'Your current password is required to change the email address.' },
          { status: 403 },
        );
      }
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existing && existing.id !== customer.id) {
        return NextResponse.json({ success: false, error: 'That email address is already in use.' }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { id: customer.id },
      data: {
        name,
        email,
        emailVerifiedAt: emailChanged ? null : customer.emailVerifiedAt,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    let verificationEmailSent = false;
    if (emailChanged) {
      verificationEmailSent = await sendVerificationEmail(user);
    }

    const token = await signAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    const response = NextResponse.json({
      success: true,
      user: {
        ...user,
        emailVerified: Boolean(user.emailVerifiedAt),
      },
      emailChanged,
      verificationEmailSent,
    });
    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);
    return response;
  } catch (error) {
    console.error('Customer profile update failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to update your profile.' }, { status: 500 });
  }
}
