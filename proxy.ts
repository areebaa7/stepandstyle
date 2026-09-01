import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const requiresAdmin = path.startsWith('/admin');
  const requiresAdminApi = path.startsWith('/api/admin/');
  const requiresInfluencer = path.startsWith('/influencer');
  const requiresCustomer = path.startsWith('/account');
  const storeRestricted =
    path === '/' || path.startsWith('/products') || path.startsWith('/checkout');
  const adminPreviewAllowed = request.nextUrl.searchParams.get('preview') === 'true';

  if (
    !requiresAdmin &&
    !requiresAdminApi &&
    !requiresInfluencer &&
    !requiresCustomer &&
    !storeRestricted
  ) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    null;
  const payload = token ? await verifyAuthToken(token) : null;

  if (requiresAdminApi && !payload) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.' },
      { status: 401 },
    );
  }

  if (requiresAdminApi && payload?.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Admin access required.' },
      { status: 403 },
    );
  }

  if ((requiresAdmin || requiresInfluencer || requiresCustomer) && !payload) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (requiresAdmin && (!payload || payload.role !== 'ADMIN')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (requiresInfluencer && (!payload || payload.role !== 'INFLUENCER')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (requiresCustomer && payload?.role !== 'USER') {
    if (payload?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (payload?.role === 'INFLUENCER') {
      return NextResponse.redirect(new URL('/influencer', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (storeRestricted && payload?.role === 'ADMIN' && !adminPreviewAllowed) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/influencer/:path*',
    '/account/:path*',
    '/',
    '/products/:path*',
    '/checkout',
  ],
};

