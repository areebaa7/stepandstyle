import { NextResponse } from 'next/server';
import { getStorefrontSettings } from '@/lib/storefrontSettings.server';

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: await getStorefrontSettings() });
  } catch (error) {
    console.error('Error fetching public storefront settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch storefront settings.' }, { status: 500 });
  }
}
