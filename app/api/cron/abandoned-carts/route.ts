import { NextResponse } from 'next/server';
import { buildPromoEmail, sendEmail } from '@/lib/email';
import { getRecoverableCarts, markRecoveryEmailSent } from '@/lib/growth.server';
import { isCronAuthorized } from '@/lib/cronAuth';
import { logError, logInfo, logWarn } from '@/lib/logger';
import { getStorefrontSettings } from '@/lib/storefrontSettings.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!isCronAuthorized(request.headers.get('authorization'), secret)) {
    logWarn('cron.abandoned_cart_unauthorized');
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { abandonedCartRecovery } = await getStorefrontSettings();
    if (!abandonedCartRecovery.enabled) {
      logInfo('cron.abandoned_cart_disabled');
      return NextResponse.json({ success: true, mode: 'DISABLED', checked: 0, sent: 0, skipped: 0 });
    }
    const carts = await getRecoverableCarts(abandonedCartRecovery.delayHours, abandonedCartRecovery.enabledAt);
    let sent = 0;
    let skipped = 0;
    const checkoutUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.stepandstyl.com'}/checkout`;

    for (const cart of carts) {
      const delivered = await sendEmail({
        to: cart.email,
        subject: abandonedCartRecovery.subject,
        html: buildPromoEmail(
          abandonedCartRecovery.heading,
          abandonedCartRecovery.message.replaceAll('{{cartTotal}}', `Rs. ${cart.subtotal.toFixed(2)}`),
          checkoutUrl,
          abandonedCartRecovery.ctaText,
        ),
      });
      if (delivered) {
        await markRecoveryEmailSent(cart.userId);
        sent += 1;
      } else {
        skipped += 1;
      }
    }

    logInfo('cron.abandoned_cart_completed', { checked: carts.length, sent, skipped });
    return NextResponse.json({
      success: true,
      mode: skipped > 0 ? 'PROVIDERLESS' : 'DELIVERY',
      checked: carts.length,
      sent,
      skipped,
    });
  } catch (error) {
    logError('cron.abandoned_cart_failed', { error });
    return NextResponse.json({ success: false, error: 'Recovery job failed.' }, { status: 500 });
  }
}
