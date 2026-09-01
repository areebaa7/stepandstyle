import nodemailer from 'nodemailer';
import { logError, logInfo } from './logger';

export { buildPromoEmail } from './emailTemplate.mjs';

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || `IPL Store <${smtpUser}>`;
const emailDeliveryEnabled = process.env.EMAIL_DELIVERY_ENABLED === 'true';

const transporter =
  emailDeliveryEnabled && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 5_000,
        greetingTimeout: 5_000,
        socketTimeout: 10_000,
      })
    : null;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export function getEmailDeliveryStatus() {
  const missing = [
    ...(!emailDeliveryEnabled ? ['EMAIL_DELIVERY_ENABLED=true'] : []),
    ...(!smtpUser ? ['SMTP_USER'] : []),
    ...(!smtpPass ? ['SMTP_PASS'] : []),
  ];
  return {
    mode: transporter ? 'SMTP' as const : 'PROVIDERLESS' as const,
    configured: Boolean(transporter),
    deliveryEnabled: emailDeliveryEnabled,
    missing,
  };
}

export async function verifyEmailConfiguration() {
  if (!transporter) return getEmailDeliveryStatus();
  await transporter.verify();
  return getEmailDeliveryStatus();
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!transporter) {
    logInfo('email.delivery_skipped', { reason: 'provider_not_configured', channel: 'single' });
    return false;
  }

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    html,
  });
  return true;
}

interface SendBulkEmailOptions {
  bcc: string[];
  subject: string;
  html: string;
}

export async function sendBulkEmail({ bcc, subject, html }: SendBulkEmailOptions) {
  if (!transporter) {
    logInfo('email.delivery_skipped', { reason: 'provider_not_configured', channel: 'bulk', recipientCount: bcc.length });
    return;
  }

  // Send in batches of 50 to avoid SMTP limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < bcc.length; i += BATCH_SIZE) {
    const batch = bcc.slice(i, i + BATCH_SIZE);
    try {
      await transporter.sendMail({
        from: smtpFrom,
        bcc: batch,
        subject,
        html,
      });
      logInfo('email.bulk_batch_sent', { batch: i / BATCH_SIZE + 1, recipientCount: batch.length });
    } catch (error) {
      logError('email.bulk_batch_failed', { batch: i / BATCH_SIZE + 1, recipientCount: batch.length, error });
    }
  }
}

interface MarketingRecipient {
  email: string;
  unsubscribeToken: string;
}

export async function sendMarketingEmails({
  recipients,
  subject,
  html,
}: {
  recipients: MarketingRecipient[];
  subject: string;
  html: string;
}) {
  if (!transporter) {
    logInfo('email.delivery_skipped', { reason: 'provider_not_configured', channel: 'marketing', recipientCount: recipients.length });
    return;
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  for (let index = 0; index < recipients.length; index += 10) {
    const batch = recipients.slice(index, index + 10);
    await Promise.allSettled(batch.map((recipient) => {
      const unsubscribeUrl = `${appUrl}/unsubscribe?token=${encodeURIComponent(recipient.unsubscribeToken)}`;
      const personalizedHtml = `${html}
        <p style="margin-top:24px;font-size:12px;color:#777;text-align:center">
          You opted in to Step & Styl marketing emails.
          <a href="${unsubscribeUrl}" style="color:#6B21A8">Unsubscribe</a>
        </p>`;
      return transporter.sendMail({ from: smtpFrom, to: recipient.email, subject, html: personalizedHtml });
    }));
  }
}
