import { NextResponse } from 'next/server';
import { unsubscribeNewsletter } from '@/lib/growth.server';

const TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const token = body && typeof body === 'object' && !Array.isArray(body)
      ? String((body as Record<string, unknown>).token || '').trim()
      : '';

    if (!TOKEN_PATTERN.test(token)) {
      return NextResponse.json({ success: false, error: 'Invalid unsubscribe link.' }, { status: 400 });
    }

    const found = await unsubscribeNewsletter(token);
    if (!found) {
      return NextResponse.json({ success: false, error: 'This unsubscribe link is not valid.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'You have been unsubscribed.' });
  } catch (error) {
    console.error('Newsletter unsubscribe failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to unsubscribe right now.' }, { status: 500 });
  }
}
