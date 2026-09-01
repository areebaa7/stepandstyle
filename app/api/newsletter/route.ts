import { NextResponse } from 'next/server';
import { consumeNewsletterRateLimit, subscribeNewsletter } from '@/lib/growth.server';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const rawBody: unknown = await request.json();
    const email = rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)
      ? String((rawBody as Record<string, unknown>).email || '').trim().toLowerCase()
      : '';
    const body = rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)
      ? rawBody as Record<string, unknown>
      : {};
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (body.consent !== true) {
      return NextResponse.json(
        { success: false, error: 'Please agree to receive marketing emails.' },
        { status: 400 },
      );
    }

    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const ipAddress = forwardedFor || request.headers.get('x-real-ip') || 'unknown';
    const withinLimit = await consumeNewsletterRateLimit(`${ipAddress}:${email}`);
    if (!withinLimit) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again in 15 minutes.' },
        { status: 429, headers: { 'Retry-After': '900' } },
      );
    }

    const source = body.source === 'popup' ? 'popup' : 'footer';
    const result = await subscribeNewsletter({
      email,
      source,
      consent: true,
      ipAddress,
      userAgent: request.headers.get('user-agent'),
    });
    return NextResponse.json({
      success: true,
      message: 'You are subscribed.',
      discountCode: result.discountCode,
    });
  } catch (error) {
    console.error('Newsletter subscription failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to subscribe right now.' }, { status: 500 });
  }
}
