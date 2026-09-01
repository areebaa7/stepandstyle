import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { NewsletterStatus, Prisma } from '@prisma/client';
import { isAdminRequest } from '@/lib/adminAuth';
import { unsubscribeNewsletter } from '@/lib/growth.server';
import { getNewsletterSettings } from '@/lib/newsletterSettings.server';
import {
  syncEmailMarketingProvider,
  syncWooCommerceCustomer,
} from '@/lib/newsletterIntegrations.server';

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const pageSize = 50;
    const search = url.searchParams.get('search')?.trim().toLowerCase() || '';
    const requestedStatus = url.searchParams.get('status');
    const status: NewsletterStatus | undefined = requestedStatus === 'SUBSCRIBED' || requestedStatus === 'UNSUBSCRIBED'
      ? requestedStatus
      : undefined;
    const where: Prisma.NewsletterSubscriberWhereInput = {
      ...(search ? { email: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(status ? { status } : {}),
    };

    const [subscribers, total, subscribed, unsubscribed] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          status: true,
          source: true,
          consentAt: true,
          consentVersion: true,
          provider: true,
          providerSyncStatus: true,
          providerError: true,
          wooSyncStatus: true,
          wooError: true,
          updatedAt: true,
        },
      }),
      prisma.newsletterSubscriber.count({ where }),
      prisma.newsletterSubscriber.count({ where: { status: 'SUBSCRIBED' } }),
      prisma.newsletterSubscriber.count({ where: { status: 'UNSUBSCRIBED' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: subscribers,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
      summary: { total: subscribed + unsubscribed, subscribed, unsubscribed },
    });
  } catch (error) {
    console.error('Failed to load newsletter subscribers:', error);
    return NextResponse.json({ success: false, error: 'Failed to load subscribers.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const input = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
    const id = String(input.id || '');
    const action = String(input.action || '');
    const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!subscriber) {
      return NextResponse.json({ success: false, error: 'Subscriber not found.' }, { status: 404 });
    }

    if (action === 'unsubscribe') {
      await unsubscribeNewsletter(subscriber.unsubscribeToken);
      return NextResponse.json({ success: true });
    }
    if (action !== 'retry') {
      return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
    }
    if (subscriber.status !== 'SUBSCRIBED') {
      return NextResponse.json({ success: false, error: 'Unsubscribed contacts cannot be resubscribed by an administrator.' }, { status: 400 });
    }

    const settings = await getNewsletterSettings();
    const [providerResult, wooResult] = await Promise.all([
      syncEmailMarketingProvider(settings.provider, subscriber.email, true),
      settings.wooCommerceSyncEnabled
        ? syncWooCommerceCustomer(subscriber.email, true)
        : Promise.resolve({ status: 'SKIPPED' as const, error: undefined }),
    ]);
    await prisma.newsletterSubscriber.update({
      where: { id },
      data: {
        provider: settings.provider,
        providerSyncStatus: providerResult.status,
        providerContactId: providerResult.contactId || null,
        providerSyncedAt: providerResult.status === 'SYNCED' ? new Date() : null,
        providerError: providerResult.error || null,
        wooSyncStatus: wooResult.status,
        wooSyncedAt: wooResult.status === 'SYNCED' ? new Date() : null,
        wooError: wooResult.error || null,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update newsletter subscriber:', error);
    return NextResponse.json({ success: false, error: 'Failed to update subscriber.' }, { status: 500 });
  }
}
