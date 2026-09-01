import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const DEFAULT_SPLASH_SETTINGS = {
  enabled: false,
  title: 'Step & Styl',
  subtitle: 'Premium footwear for the modern individual.',
  imageUrl: '/logo_main.png',
  backgroundColor: '#A855F7',
  textColor: '#FFFFFF',
  buttonText: 'Enter Site',
  buttonEnabled: true,
  dismissMode: 'AUTO',
  durationSeconds: 3,
};

export async function GET() {
  try {
    const settings = await prisma.splashScreenSettings.findUnique({
      where: { id: 'splash_screen_settings' },
    });

    if (!settings || !settings.enabled) {
      return NextResponse.json({ success: true, data: { enabled: false } });
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled: settings.enabled,
        title: settings.title ?? DEFAULT_SPLASH_SETTINGS.title,
        subtitle: settings.subtitle ?? DEFAULT_SPLASH_SETTINGS.subtitle,
        imageUrl: settings.imageUrl ?? DEFAULT_SPLASH_SETTINGS.imageUrl,
        backgroundColor: settings.backgroundColor ?? DEFAULT_SPLASH_SETTINGS.backgroundColor,
        textColor: settings.textColor ?? DEFAULT_SPLASH_SETTINGS.textColor,
        buttonText: settings.buttonText ?? DEFAULT_SPLASH_SETTINGS.buttonText,
        buttonEnabled: settings.buttonEnabled,
        dismissMode: settings.dismissMode ?? DEFAULT_SPLASH_SETTINGS.dismissMode,
        durationSeconds: settings.durationSeconds ?? DEFAULT_SPLASH_SETTINGS.durationSeconds,
      },
    });
  } catch (error) {
    console.error('Error fetching splash screen settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch splash screen settings' }, { status: 500 });
  }
}
