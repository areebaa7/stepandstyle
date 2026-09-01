import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getStorefrontSettings } from '@/lib/storefrontSettings.server';
import { sendEmail } from '@/lib/email';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeChannelUrl(value: unknown) {
  if (typeof value !== 'string' || value.length > 500) return null;

  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const storefrontSettings = await getStorefrontSettings();
    if (!storefrontSettings.affiliateProgram.enabled) {
      return NextResponse.json({ error: 'New affiliate applications are currently paused.' }, { status: 503 });
    }

    const body = await request.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const channelLink1 = normalizeChannelUrl(body?.channelLink1);
    const channelLink2 = body?.channelLink2 ? normalizeChannelUrl(body.channelLink2) : null;

    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!channelLink1 || (body?.channelLink2 && !channelLink2)) {
      return NextResponse.json(
        { error: 'Channel links must be valid HTTP or HTTPS URLs.' },
        { status: 400 },
      );
    }

    const [existingUser, existingApplication] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.affiliateApplication.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (existingApplication?.status === 'PENDING') {
      return NextResponse.json({ error: 'You already have a pending application.' }, { status: 409 });
    }

    if (existingApplication?.status === 'APPROVED') {
      return NextResponse.json({ error: 'This email already has an approved affiliate account.' }, { status: 409 });
    }

    if (existingUser && !existingApplication) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in or contact support.' },
        { status: 409 },
      );
    }

    if (existingUser && existingUser.role !== 'INFLUENCER') {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please contact support to apply.' },
        { status: 409 },
      );
    }

    const application = existingApplication?.status === 'REJECTED'
      ? await prisma.affiliateApplication.update({
          where: { id: existingApplication.id },
          data: {
            channelLink1,
            channelLink2,
            status: 'PENDING',
            reviewedBy: null,
            reviewedAt: null,
            notes: null,
          },
        })
      : await prisma.affiliateApplication.create({
          data: { email, channelLink1, channelLink2 },
        });

    await sendEmail({
      to: email,
      subject: 'Step & Styl affiliate application received',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:auto">
          <h2>Application received</h2>
          <p>Thank you for applying to the Step & Styl affiliate program.</p>
          <p>Your application is pending admin review. No account or promo code is active yet.</p>
        </div>
      `,
    }).catch((error) => console.error('Affiliate application email failed:', error));

    return NextResponse.json({
      success: true,
      application: {
        id: application.id,
        email: application.email,
        status: application.status,
      },
    });
  } catch (error) {
    console.error('Error creating affiliate application:', error);
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 });
  }
}
