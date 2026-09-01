import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { markAbandonedCartRecovered, saveAbandonedCart } from '@/lib/growth.server';
import { getStorefrontSettings } from '@/lib/storefrontSettings.server';

export async function POST(request: Request) {
  try {
    const cookieToken = request.headers.get('cookie')
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`))
      ?.slice(AUTH_COOKIE_NAME.length + 1);
    const token = cookieToken ? decodeURIComponent(cookieToken) : null;
    const payload = token ? await verifyAuthToken(token) : null;
    if (!payload || payload.role === 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true } });
    if (!user) return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    const { abandonedCartRecovery } = await getStorefrontSettings();
    if (!abandonedCartRecovery.enabled) {
      await markAbandonedCartRecovered(payload.userId);
      return NextResponse.json({ success: true, tracking: false });
    }

    const rawBody: unknown = await request.json();
    const body = rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)
      ? rawBody as Record<string, unknown>
      : {};
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (rawItems.length === 0) {
      await markAbandonedCartRecovered(payload.userId);
      return NextResponse.json({ success: true });
    }

    const items = rawItems.slice(0, 50).map((entry) => {
      const item = entry && typeof entry === 'object' && !Array.isArray(entry)
        ? entry as Record<string, unknown>
        : {};
      return {
        id: String(item.id || ''),
        title: String(item.title || 'Product').slice(0, 120),
        price: Math.max(0, Number(item.price) || 0),
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        size: typeof item.size === 'string' ? item.size.slice(0, 30) : null,
        color: typeof item.color === 'string' ? item.color.slice(0, 50) : null,
      };
    });

    await saveAbandonedCart(payload.userId, user.email, items, Math.max(0, Number(body.subtotal) || 0));
    return NextResponse.json({ success: true, tracking: true });
  } catch (error) {
    console.error('Abandoned cart tracking failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to save cart recovery data.' }, { status: 500 });
  }
}
