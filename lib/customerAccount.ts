import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import type { AffiliateProgramSettings } from '@/types/storefrontSettings';

export const CUSTOMER_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export type CustomerTokenType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

const TOKEN_LIFETIME_MS: Record<CustomerTokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
};

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001').replace(/\/$/, '');
}

async function sendAccountEmail(options: { to: string; subject: string; html: string }) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      sendEmail(options).catch((error) => {
        console.error('Customer account email delivery failed:', error);
        return false;
      }),
      new Promise<boolean>((resolve) => {
        timeout = setTimeout(() => {
          console.error('Customer account email delivery timed out.');
          resolve(false);
        }, 6_000);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function getCustomerFromRequest(request: Request) {
  const cookieToken = request.headers
    .get('cookie')
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.slice(AUTH_COOKIE_NAME.length + 1);
  const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = cookieToken || bearerToken;
  if (!token) return null;

  const payload = await verifyAuthToken(decodeURIComponent(token));
  if (!payload || payload.role !== 'USER') return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
}

export async function createCustomerToken(userId: string, type: CustomerTokenType) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  await prisma.accountToken.deleteMany({ where: { userId, type } });
  await prisma.accountToken.create({
    data: {
      userId,
      type,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS[type]),
    },
  });

  return rawToken;
}

export async function findValidCustomerToken(rawToken: string, type: CustomerTokenType) {
  if (!rawToken || rawToken.length > 256) return null;
  return prisma.accountToken.findFirst({
    where: {
      tokenHash: hashToken(rawToken),
      type,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
}

export async function sendVerificationEmail(user: { id: string; email: string; name: string | null }) {
  const token = await createCustomerToken(user.id, 'EMAIL_VERIFICATION');
  const verificationUrl = `${getAppUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const displayName = escapeHtml(user.name || 'there');

  return sendAccountEmail({
    to: user.email,
    subject: 'Verify your Step & Styl account',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:auto">
        <h2>Verify your email</h2>
        <p>Hello ${displayName},</p>
        <p>Confirm your email address to secure your Step & Styl account and access your order history.</p>
        <p><a href="${verificationUrl}" style="display:inline-block;background:#7e22ce;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Verify email</a></p>
        <p>This link expires in 24 hours.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(user: { id: string; email: string; name: string | null }) {
  const token = await createCustomerToken(user.id, 'PASSWORD_RESET');
  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const displayName = escapeHtml(user.name || 'there');

  return sendAccountEmail({
    to: user.email,
    subject: 'Reset your Step & Styl password',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:auto">
        <h2>Reset your password</h2>
        <p>Hello ${displayName},</p>
        <p>Use the button below to choose a new password.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#7e22ce;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Reset password</a></p>
        <p>This link expires in one hour. If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendInfluencerSetupEmail(user: { id: string; email: string; name: string | null }, program: AffiliateProgramSettings) {
  const token = await createCustomerToken(user.id, 'PASSWORD_RESET');
  const setupUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const displayName = escapeHtml(user.name || 'there');

  return sendAccountEmail({
    to: user.email,
    subject: 'Your Step & Styl affiliate account is approved',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:auto">
        <h2>Welcome to the Step & Styl affiliate program</h2>
        <p>Hello ${displayName},</p>
        <p>Your application has been approved. Create a secure password to activate access to your influencer dashboard.</p>
        <p>Your starting commission rate is <strong>${program.defaultCommissionPercent}%</strong>. Commission is earned at these order statuses: <strong>${escapeHtml(program.eligibleOrderStatuses.join(', '))}</strong>.</p>
        <p>Published payout schedule: ${escapeHtml(program.payoutSchedule)}. Minimum payout: PKR ${program.minimumPayoutPkr.toLocaleString('en-PK')}.</p>
        <p><a href="${setupUrl}" style="display:inline-block;background:#7e22ce;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Create password</a></p>
        <p>This secure link expires in one hour. After setting your password, sign in with ${escapeHtml(user.email)}.</p>
      </div>
    `,
  });
}
