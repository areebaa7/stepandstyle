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

    let settings = await prisma.marketingSettings.findUnique({
      where: { id: 'marketing_settings' }
    });

    if (!settings) {
      settings = await prisma.marketingSettings.create({
        data: { id: 'marketing_settings' }
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching marketing settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
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
      ga4MeasurementId,
      gtmContainerId,
      googleAdsConversionId,
      metaPixelId,
      metaPixelEnabled,
      metaCapiToken,
    } = body;

    const settings = await prisma.marketingSettings.upsert({
      where: { id: 'marketing_settings' },
      update: {
        ga4MeasurementId: ga4MeasurementId ?? null,
        gtmContainerId: gtmContainerId ?? null,
        googleAdsConversionId: googleAdsConversionId ?? null,
        metaPixelId: metaPixelId ?? null,
        metaPixelEnabled: metaPixelEnabled ?? false,
        metaCapiToken: metaCapiToken ?? null,
      },
      create: {
        id: 'marketing_settings',
        ga4MeasurementId: ga4MeasurementId ?? null,
        gtmContainerId: gtmContainerId ?? null,
        googleAdsConversionId: googleAdsConversionId ?? null,
        metaPixelId: metaPixelId ?? null,
        metaPixelEnabled: metaPixelEnabled ?? false,
        metaCapiToken: metaCapiToken ?? null,
      },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error updating marketing settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
