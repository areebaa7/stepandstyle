import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendInfluencerSetupEmail } from '@/lib/customerAccount';
import { getStorefrontSettings } from '@/lib/storefrontSettings.server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function buildPrefix(email: string) {
  const localPart = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toUpperCase();
  return (localPart || 'STYLE').slice(0, 8).padEnd(4, 'X');
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
      || request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const admin = token ? await verifyAuthToken(token) : null;
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const { affiliateProgram } = await getStorefrontSettings();
    const application = await prisma.affiliateApplication.findUnique({ where: { id } });
    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }
    if (application.status !== 'PENDING') {
      return NextResponse.json({ error: 'Application has already been processed.' }, { status: 409 });
    }

    const placeholderPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
    const approvedUser = await prisma.$transaction(async (transaction) => {
      let user = await transaction.user.findUnique({ where: { email: application.email } });

      if (user && user.role !== 'INFLUENCER') {
        throw new Error('EMAIL_BELONGS_TO_ANOTHER_ROLE');
      }

      if (!user) {
        user = await transaction.user.create({
          data: {
            email: application.email,
            name: application.email.split('@')[0],
            password: placeholderPassword,
            role: 'INFLUENCER',
          },
        });
      }

      await transaction.influencerProfile.upsert({
        where: { userId: user.id },
        update: { status: 'ACTIVE' },
        create: {
          userId: user.id,
          defaultPrefix: buildPrefix(application.email),
          commissionRate: affiliateProgram.defaultCommissionPercent / 100,
          status: 'ACTIVE',
        },
      });

      await transaction.affiliateApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: admin.userId,
          reviewedAt: new Date(),
          notes: null,
        },
      });

      return user;
    });

    const setupEmailSent = await sendInfluencerSetupEmail(approvedUser, affiliateProgram).catch((error) => {
      console.error('Influencer setup email failed:', error);
      return false;
    });

    return NextResponse.json({
      success: true,
      setupEmailSent,
      message: setupEmailSent
        ? 'Application approved and password setup email sent.'
        : 'Application approved, but the password setup email could not be sent.',
    });
  } catch (error) {
    console.error('Error approving affiliate application:', error);
    if (error instanceof Error && error.message === 'EMAIL_BELONGS_TO_ANOTHER_ROLE') {
      return NextResponse.json(
        { error: 'This email belongs to a non-influencer account. Resolve the account conflict first.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Failed to approve application.' }, { status: 500 });
  }
}
