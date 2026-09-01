import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

async function requireAdmin(request: NextRequest) {
  const token =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return null;
  }

  return payload;
}

function extractSuffix(code: string, prefix: string) {
  if (!code.startsWith(prefix)) return null;
  const parts = code.split('_');
  const suffix = parts[parts.length - 1];
  const num = Number.parseInt(suffix, 10);
  return Number.isNaN(num) ? null : num;
}

async function generateCodeForInfluencer(influencerId: string, prefix?: string) {
  const influencer = await prisma.influencerProfile.findUnique({
    where: { id: influencerId },
  });

  if (!influencer) {
    throw new Error('Influencer not found');
  }

  const resolvedPrefix = (prefix || influencer.defaultPrefix).toUpperCase();

  const lastCode = await prisma.promoCode.findFirst({
    where: { prefix: resolvedPrefix },
    orderBy: { createdAt: 'desc' },
  });

  const lastSuffix = lastCode?.code ? extractSuffix(lastCode.code, `${resolvedPrefix}_`) : null;
  const nextNumber = (lastSuffix ?? -1) + 1;
  const padded = String(nextNumber).padStart(3, '0');
  const code = `${resolvedPrefix}_${padded}`;

  return {
    code,
    prefix: resolvedPrefix,
    influencer,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const codes = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        influencer: {
          select: {
            id: true,
            defaultPrefix: true,
            commissionRate: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, codes });
  } catch (error) {
    console.error('Failed to fetch promo codes:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch promo codes.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { code, validUntil, discountPercent, influencerId, prefix: prefixOverride } = await request.json();

    if (!validUntil || discountPercent === undefined) {
      return NextResponse.json({ success: false, error: 'Validity and discount percentage are required.' }, { status: 400 });
    }

    let normalizedCode = code ? String(code).trim().toUpperCase() : '';
    let prefix: string | undefined = prefixOverride ? String(prefixOverride).trim().toUpperCase() : undefined;
    let influencer;

    if (influencerId) {
      const generated = await generateCodeForInfluencer(influencerId, prefix);
      if (!normalizedCode) {
        normalizedCode = generated.code;
      }
      prefix = generated.prefix;
      influencer = generated.influencer;
    }

    if (!normalizedCode) {
      return NextResponse.json(
        { success: false, error: 'Promo code is required. Leave blank only when assigning to an influencer.' },
        { status: 400 },
      );
    }

    if (!/^[A-Z0-9\-_]{4,40}$/.test(normalizedCode)) {
      return NextResponse.json(
        { success: false, error: 'Promo code must be 4-40 characters and include only letters, numbers, underscores, or dashes.' },
        { status: 400 },
      );
    }

    const discountValue = Number(discountPercent);
    if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
      return NextResponse.json(
        { success: false, error: 'Discount percentage must be a number between 1 and 100.' },
        { status: 400 },
      );
    }

    const expiryDate = new Date(validUntil);
    if (Number.isNaN(expiryDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid validity date supplied.' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiryDate < today) {
      return NextResponse.json({ success: false, error: 'Validity date must be today or a future date.' }, { status: 400 });
    }

    try {
      const promoCode = await prisma.promoCode.create({
        data: {
          code: normalizedCode,
          discountPercent: Math.round(discountValue),
          validUntil: expiryDate,
          prefix,
          influencerId: influencerId ?? null,
        },
        include: {
          influencer: {
            select: {
              id: true,
              defaultPrefix: true,
              commissionRate: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Send email to influencer if promo code is assigned to them
      if (promoCode.influencer && promoCode.influencer.user.email) {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .promo-code { background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                .promo-code-text { font-size: 28px; font-weight: bold; color: #9333ea; letter-spacing: 3px; margin: 10px 0; }
                .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9333ea; }
                .detail-item { margin: 10px 0; }
                .label { font-weight: bold; color: #6b7280; }
                .value { color: #111827; font-size: 16px; margin-top: 5px; }
                .button { display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Your New Promo Code is Ready!</h1>
                </div>
                <div class="content">
                  <p>Hello ${promoCode.influencer.user.name || 'there'}!</p>
                  <p>A new promo code has been assigned to your account. Start sharing it with your audience to earn commissions!</p>
                  
                  <div class="promo-code">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your Promo Code:</p>
                    <div class="promo-code-text">${promoCode.code}</div>
                  </div>

                  <div class="details">
                    <div class="detail-item">
                      <div class="label">Discount Percentage:</div>
                      <div class="value">${promoCode.discountPercent}%</div>
                    </div>
                    <div class="detail-item">
                      <div class="label">Valid Until:</div>
                      <div class="value">${new Date(promoCode.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  </div>

                  <p><strong>How to Use:</strong></p>
                  <ul>
                    <li>Share this promo code with your audience on social media</li>
                    <li>Include it in your Instagram stories, TikTok videos, and posts</li>
                    <li>Track your sales and earnings in your influencer dashboard</li>
                  </ul>

                  <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/influencer" class="button">View Dashboard</a>
                  </div>

                  <div class="footer">
                    <p>Keep promoting and earning! 🚀</p>
                    <p>If you have any questions, contact our affiliate support team.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;

        try {
          await sendEmail({
            to: promoCode.influencer.user.email,
            subject: `Your New Promo Code: ${promoCode.code} - Step & Styl`,
            html: emailHtml,
          });
        } catch (emailError) {
          console.error('Failed to send promo code email:', emailError);
          // Don't fail the request if email fails
        }
      }

      return NextResponse.json({ success: true, code: promoCode }, { status: 201 });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return NextResponse.json({ success: false, error: 'Promo code already exists. Please generate a new one.' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to create promo code:', error);
    return NextResponse.json({ success: false, error: 'Failed to create promo code.' }, { status: 500 });
  }
}


