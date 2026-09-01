import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CUSTOMER_PASSWORD_REGEX, getCustomerFromRequest } from '@/lib/customerAccount';

export async function POST(request: Request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: unknown = await request.json();
    const values = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
    const currentPassword = typeof values.currentPassword === 'string' ? values.currentPassword : '';
    const newPassword = typeof values.newPassword === 'string' ? values.newPassword : '';

    if (!(await bcrypt.compare(currentPassword, customer.password))) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect.' }, { status: 403 });
    }
    if (!CUSTOMER_PASSWORD_REGEX.test(newPassword)) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 8 characters and include letters and numbers.' },
        { status: 400 },
      );
    }
    if (await bcrypt.compare(newPassword, customer.password)) {
      return NextResponse.json(
        { success: false, error: 'Your new password must be different from the current password.' },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: customer.id },
        data: { password: await bcrypt.hash(newPassword, 12) },
      }),
      prisma.accountToken.deleteMany({
        where: { userId: customer.id, type: 'PASSWORD_RESET' },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Customer password change failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to change your password.' }, { status: 500 });
  }
}
