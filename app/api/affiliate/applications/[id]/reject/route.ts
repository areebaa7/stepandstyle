import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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
    const body = await request.json();
    const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 1000) : '';
    const application = await prisma.affiliateApplication.findUnique({ where: { id } });

    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }
    if (application.status !== 'PENDING') {
      return NextResponse.json({ error: 'Application has already been processed.' }, { status: 409 });
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.affiliateApplication.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedBy: admin.userId,
          reviewedAt: new Date(),
          notes: notes || null,
        },
      });

      const existingUser = await transaction.user.findUnique({
        where: { email: application.email },
        include: { influencerProfile: true },
      });
      if (existingUser?.influencerProfile) {
        await transaction.influencerProfile.update({
          where: { id: existingUser.influencerProfile.id },
          data: { status: 'SUSPENDED' },
        });
      }
    });

    await sendEmail({
      to: application.email,
      subject: 'Update on your Step & Styl affiliate application',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px;margin:auto">
          <h2>Application update</h2>
          <p>Thank you for your interest in the Step & Styl affiliate program.</p>
          <p>We are unable to approve your application at this time.</p>
          ${notes ? `<p><strong>Review note:</strong> ${escapeHtml(notes)}</p>` : ''}
          <p>You may submit an updated application later.</p>
        </div>
      `,
    }).catch((error) => console.error('Affiliate rejection email failed:', error));

    return NextResponse.json({ success: true, message: 'Application rejected.' });
  } catch (error) {
    console.error('Error rejecting affiliate application:', error);
    return NextResponse.json({ error: 'Failed to reject application.' }, { status: 500 });
  }
}
