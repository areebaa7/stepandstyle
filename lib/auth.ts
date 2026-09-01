import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export type UserRole = 'USER' | 'ADMIN' | 'INFLUENCER';

export const AUTH_COOKIE_NAME = 'stepstyle_auth';

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  name?: string | null;
}

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'verysecurekey-step-and-style-jwt-default';
  return new TextEncoder().encode(secret);
};

const getJwtExpiry = () => process.env.JWT_EXPIRES_IN || '1d';

export async function signAuthToken(payload: TokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(getJwtExpiry())
    .sign(getSecretKey());
}

export async function verifyAuthToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export const authCookieOptions = {
  httpOnly: true,
  sameSite: (process.env.COOKIE_SAME_SITE as 'strict' | 'lax' | 'none') || 'strict',
  secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24, // 1 day
} as const;

export function getAuthTokenFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const authCookie = cookieHeader
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.slice(AUTH_COOKIE_NAME.length + 1);
  const bearerMatch = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i);
  const token = authCookie || bearerMatch?.[1]?.trim() || null;

  if (!token) return null;

  try {
    return decodeURIComponent(token);
  } catch {
    return null;
  }
}

export async function verifyAdminRequest(request: Request) {
  const token = getAuthTokenFromRequest(request);
  const payload = token ? await verifyAuthToken(token) : null;
  return payload?.role === 'ADMIN' ? payload : null;
}
