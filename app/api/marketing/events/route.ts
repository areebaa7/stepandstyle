import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const rawBody: unknown = await req.json();
    const body = rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)
      ? rawBody as Record<string, unknown>
      : {};
    const { eventName, eventData, url } = body;

    if (typeof eventName !== 'string' || !eventName.trim()) {
      return NextResponse.json({ success: false, error: 'Event name is required' }, { status: 400 });
    }
    if (eventName.trim().toLowerCase() === 'purchase') {
      return NextResponse.json(
        { success: false, code: 'RESERVED_EVENT', error: 'Purchase events are recorded by the order service.' },
        { status: 403 },
      );
    }

    const safeEventData = eventData && typeof eventData === 'object' && !Array.isArray(eventData)
      ? eventData as Record<string, unknown>
      : {};

    // Try to get user identity from auth cookie
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    let userInfo = null;
    
    if (token) {
      const payload = await verifyAuthToken(token);
      if (payload) {
        userInfo = {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
        };
      }
    }

    // Capture basic request data for anonymous tracking
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    // Merge identity data into eventData safely
    const enrichedData = {
      ...safeEventData,
      _identity: {
        user: userInfo || 'anonymous',
        ip,
      }
    };

    const newEvent = await prisma.marketingEvent.create({
      data: {
        eventName: eventName.trim().slice(0, 100),
        eventData: enrichedData,
        url: typeof url === 'string' ? url.slice(0, 2048) : null,
      },
    });

    return NextResponse.json({ success: true, data: newEvent });
  } catch (error: unknown) {
    console.error('Failed to log marketing event:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
