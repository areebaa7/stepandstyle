import { createHash } from 'crypto';
import type { EmailMarketingProvider } from '@/lib/newsletterSettings.server';

export interface IntegrationResult {
  status: 'SYNCED' | 'SKIPPED' | 'FAILED';
  contactId?: string;
  error?: string;
}

const request = async (url: string, init: RequestInit) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`Provider returned ${response.status}${detail ? `: ${detail}` : ''}`);
    }
    if (response.status === 204 || response.status === 202) return null;
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const syncMailchimp = async (email: string, subscribed: boolean): Promise<IntegrationResult> => {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  const serverPrefix =
    process.env.MAILCHIMP_SERVER_PREFIX || apiKey?.split('-').at(-1);

  if (!apiKey || !listId || !serverPrefix) {
    return { status: 'FAILED', error: 'Mailchimp credentials are not configured.' };
  }

  const memberHash = createHash('md5').update(email).digest('hex');
  const data = await request(
    `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${encodeURIComponent(listId)}/members/${memberHash}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${Buffer.from(`stepandstyl:${apiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: subscribed ? 'subscribed' : 'unsubscribed',
        status: subscribed ? 'subscribed' : 'unsubscribed',
      }),
    },
  ) as { id?: string } | null;

  return { status: 'SYNCED', contactId: data?.id };
};

const syncBrevo = async (email: string, subscribed: boolean): Promise<IntegrationResult> => {
  const apiKey = process.env.BREVO_API_KEY;
  const configuredListId = Number(process.env.BREVO_LIST_ID);
  if (!apiKey) return { status: 'FAILED', error: 'Brevo credentials are not configured.' };

  const headers = { 'api-key': apiKey, 'Content-Type': 'application/json' };
  if (subscribed) {
    await request('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        updateEnabled: true,
        emailBlacklisted: false,
        ...(Number.isInteger(configuredListId) && configuredListId > 0
          ? { listIds: [configuredListId] }
          : {}),
      }),
    });
  } else {
    await request(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ emailBlacklisted: true }),
    });
  }

  return { status: 'SYNCED' };
};

const syncKlaviyo = async (email: string, subscribed: boolean): Promise<IntegrationResult> => {
  const apiKey = process.env.KLAVIYO_API_KEY;
  const listId = process.env.KLAVIYO_LIST_ID;
  if (!apiKey || !listId) {
    return { status: 'FAILED', error: 'Klaviyo credentials are not configured.' };
  }

  const type = subscribed
    ? 'profile-subscription-bulk-create-job'
    : 'profile-subscription-bulk-delete-job';
  const endpoint = subscribed
    ? 'profile-subscription-bulk-create-jobs'
    : 'profile-subscription-bulk-delete-jobs';

  await request(`https://a.klaviyo.com/api/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      accept: 'application/vnd.api+json',
      'content-type': 'application/vnd.api+json',
      revision: process.env.KLAVIYO_API_REVISION || '2026-07-15',
    },
    body: JSON.stringify({
      data: {
        type,
        attributes: {
          profiles: {
            data: [{
              type: 'profile',
              attributes: {
                email,
                subscriptions: {
                  email: { marketing: { consent: subscribed ? 'SUBSCRIBED' : 'UNSUBSCRIBED' } },
                },
              },
            }],
          },
        },
        relationships: { list: { data: { type: 'list', id: listId } } },
      },
    }),
  });

  return { status: 'SYNCED' };
};

export async function syncEmailMarketingProvider(
  provider: EmailMarketingProvider,
  email: string,
  subscribed: boolean,
): Promise<IntegrationResult> {
  if (provider === 'NONE') return { status: 'SKIPPED' };

  try {
    if (provider === 'MAILCHIMP') return await syncMailchimp(email, subscribed);
    if (provider === 'BREVO') return await syncBrevo(email, subscribed);
    return await syncKlaviyo(email, subscribed);
  } catch (error) {
    return {
      status: 'FAILED',
      error: error instanceof Error ? error.message.slice(0, 500) : 'Provider sync failed.',
    };
  }
}

export async function syncWooCommerceCustomer(
  email: string,
  subscribed: boolean,
): Promise<IntegrationResult> {
  const siteUrl = process.env.WOOCOMMERCE_URL?.replace(/\/+$/, '');
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
  if (!siteUrl || !consumerKey || !consumerSecret) {
    return { status: 'FAILED', error: 'WooCommerce credentials are not configured.' };
  }

  const auth = `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`;
  const headers = { Authorization: auth, 'Content-Type': 'application/json' };

  try {
    const matches = await request(
      `${siteUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}&per_page=1`,
      { headers },
    ) as Array<{ id: number }>;

    const metaData = [
      { key: 'marketing_opt_in', value: subscribed ? 'yes' : 'no' },
      { key: 'marketing_consent_updated_at', value: new Date().toISOString() },
      { key: 'marketing_consent_source', value: 'step-and-styl' },
    ];

    if (matches[0]?.id) {
      await request(`${siteUrl}/wp-json/wc/v3/customers/${matches[0].id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ meta_data: metaData }),
      });
      return { status: 'SYNCED', contactId: String(matches[0].id) };
    }

    if (!subscribed) return { status: 'SKIPPED' };

    const created = await request(`${siteUrl}/wp-json/wc/v3/customers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, meta_data: metaData }),
    }) as { id?: number };

    return { status: 'SYNCED', contactId: created.id ? String(created.id) : undefined };
  } catch (error) {
    return {
      status: 'FAILED',
      error: error instanceof Error ? error.message.slice(0, 500) : 'WooCommerce sync failed.',
    };
  }
}
