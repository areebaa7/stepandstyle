import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    let settings = await prisma.splashScreenSettings.findUnique({
      where: { id: 'splash_screen_settings' },
    });

    if (!settings) {
      settings = await prisma.splashScreenSettings.create({
        data: { id: 'splash_screen_settings' },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching splash screen settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch splash screen settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      enabled,
      title,
      subtitle,
      imageUrl,
      backgroundColor,
      textColor,
      buttonText,
      buttonEnabled,
      dismissMode,
      durationSeconds,
    } = body;

    const clampedDuration = Math.min(Math.max(Number(durationSeconds) || 3, 1), 15);
    const normalizedDismissMode = dismissMode === 'BUTTON' ? 'BUTTON' : 'AUTO';

    const settings = await prisma.splashScreenSettings.upsert({
      where: { id: 'splash_screen_settings' },
      update: {
        enabled: Boolean(enabled),
        title: typeof title === 'string' && title.trim() ? title.trim() : null,
        subtitle: typeof subtitle === 'string' && subtitle.trim() ? subtitle.trim() : null,
        imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null,
        backgroundColor: typeof backgroundColor === 'string' && backgroundColor.trim() ? backgroundColor.trim() : '#A855F7',
        textColor: typeof textColor === 'string' && textColor.trim() ? textColor.trim() : '#FFFFFF',
        buttonText: typeof buttonText === 'string' && buttonText.trim() ? buttonText.trim() : 'Enter Site',
        buttonEnabled: Boolean(buttonEnabled),
        dismissMode: normalizedDismissMode,
        durationSeconds: clampedDuration,
      },
      create: {
        id: 'splash_screen_settings',
        enabled: Boolean(enabled),
        title: typeof title === 'string' && title.trim() ? title.trim() : null,
        subtitle: typeof subtitle === 'string' && subtitle.trim() ? subtitle.trim() : null,
        imageUrl: typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null,
        backgroundColor: typeof backgroundColor === 'string' && backgroundColor.trim() ? backgroundColor.trim() : '#A855F7',
        textColor: typeof textColor === 'string' && textColor.trim() ? textColor.trim() : '#FFFFFF',
        buttonText: typeof buttonText === 'string' && buttonText.trim() ? buttonText.trim() : 'Enter Site',
        buttonEnabled: Boolean(buttonEnabled),
        dismissMode: normalizedDismissMode,
        durationSeconds: clampedDuration,
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error updating splash screen settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update splash screen settings' }, { status: 500 });
  }
}
