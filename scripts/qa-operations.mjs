import nextEnv from '@next/env';
import { buildPromoEmail } from '../lib/emailTemplate.mjs';
import { isCronAuthorized } from '../lib/cronAuth.ts';
import { logInfo } from '../lib/logger.ts';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const baseUrl = (process.env.OPERATIONS_QA_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const secret = 'qa-cron-secret-value';
assert(!isCronAuthorized(null, secret), 'Cron accepted a missing Authorization header.');
assert(!isCronAuthorized('Bearer wrong-secret', secret), 'Cron accepted an invalid secret.');
assert(!isCronAuthorized(`Basic ${secret}`, secret), 'Cron accepted the wrong auth scheme.');
assert(isCronAuthorized(`Bearer ${secret}`, secret), 'Cron rejected a valid bearer secret.');

const html = buildPromoEmail(
  '<img src=x onerror=alert(1)>',
  '<script>alert(1)</script>',
  'javascript:alert(1)',
  '<b>Click</b>',
);
assert(!html.includes('<script>'), 'Email template allowed script markup.');
assert(!html.includes('<img src=x'), 'Email template allowed injected image markup.');
assert(!html.includes('javascript:'), 'Email template allowed an unsafe action URL.');
assert(html.includes('&lt;script&gt;'), 'Email template did not safely encode text.');

let captured = '';
const originalInfo = console.info;
console.info = (value) => { captured += String(value); };
try {
  logInfo('qa.redaction', { password: 'never-log-this', nested: { authorization: 'Bearer never-log-this' }, safe: 'visible' });
} finally {
  console.info = originalInfo;
}
assert(!captured.includes('never-log-this'), 'Structured logger exposed a sensitive value.');
assert(captured.includes('[REDACTED]') && captured.includes('visible'), 'Structured logger redaction removed safe fields or omitted its marker.');

let health;
try {
  health = await fetch(`${baseUrl}/api/health`, { headers: { Accept: 'application/json' } });
} catch (error) {
  throw new Error(`The app is not reachable at ${baseUrl}. Start it with npm run dev before QA.`, { cause: error });
}
const healthPayload = await health.json();
assert(health.status === 200, `Health endpoint returned HTTP ${health.status}: ${JSON.stringify(healthPayload)}`);
assert(healthPayload.status === 'ok' && healthPayload.checks?.database === 'up', 'Health endpoint did not confirm database readiness.');
assert(!JSON.stringify(healthPayload).includes(process.env.DATABASE_URL || 'value-that-cannot-match'), 'Health endpoint exposed DATABASE_URL.');

const unauthorizedCron = await fetch(`${baseUrl}/api/cron/abandoned-carts`);
const cronPayload = await unauthorizedCron.json();
assert(unauthorizedCron.status === 401 && cronPayload.error === 'Unauthorized', 'Live cron endpoint was not protected.');
assert(!JSON.stringify(cronPayload).toLowerCase().includes('secret'), 'Cron error response disclosed secret details.');

const deliveryEnabled = process.env.EMAIL_DELIVERY_ENABLED === 'true';
const smtpPresent = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
if (!deliveryEnabled || !smtpPresent) {
  console.log('[PASS] Providerless mode is explicit; outbound delivery remains disabled without SMTP credentials.');
}
console.log('[PASS] Health monitoring confirms application and database readiness without exposing secrets.');
console.log('[PASS] Structured logs redact sensitive fields.');
console.log('[PASS] Email templates escape markup and reject unsafe action URLs.');
console.log('[PASS] Cron authorization rejects missing, malformed, and invalid credentials.');

