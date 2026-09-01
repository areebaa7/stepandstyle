import { NextResponse } from 'next/server';
import { getCustomerFromRequest, sendVerificationEmail } from '@/lib/customerAccount';

export async function POST(request: Request) {
  try {
    const user = await getCustomerFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (user.emailVerifiedAt) {
      return NextResponse.json({ success: true, message: 'Your email is already verified.' });
    }

    const sent = await sendVerificationEmail(user);
    return NextResponse.json({
      success: true,
      message: sent
        ? 'A new verification email has been sent.'
        : 'Verification email is ready, but email delivery is not configured yet.',
    });
  } catch (error) {
    console.error('Verification resend failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to resend verification email.' }, { status: 500 });
  }
}
