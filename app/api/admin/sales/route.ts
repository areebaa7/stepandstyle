import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMarketingEmails, buildPromoEmail } from '@/lib/email';
import { isAdminRequest } from '@/lib/adminAuth';
import { applySaleDiscounts } from '@/lib/saleEvents';

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const sales = await prisma.saleEvent.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ sales });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { name, bannerText, isActive, discountPercent, targetCollections, targetProducts } = body;

    const sale = await prisma.saleEvent.create({
      data: { 
        name, 
        bannerText, 
        isActive, 
        discountPercent, 
        targetCollections,
        targetProducts
      },
    });

    await applySaleDiscounts();

    if (body.sendPromoEmail) {
      const subscribers = await prisma.newsletterSubscriber.findMany({
        where: { status: 'SUBSCRIBED' },
        select: { email: true, unsubscribeToken: true },
      });
      
      if (subscribers.length > 0) {
        const html = buildPromoEmail(
          'Huge Sale Event!',
          `We just launched a new sale event: <strong>${name}</strong>. Enjoy up to ${discountPercent}% off on selected items! Hurry up and grab your favorites before the stock runs out.`,
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`,
          'Shop the Sale'
        );
        sendMarketingEmails({
          recipients: subscribers,
          subject: `Sale Alert: ${name} is live!`,
          html,
        }).catch(err => console.error('Background promo email error:', err));
      }
    }

    return NextResponse.json({ sale });
  } catch (error: unknown) {
    console.error(error);
    const prismaError = error as { code?: string; meta?: { target?: string } };
    if (prismaError?.code === 'P2002' && prismaError?.meta?.target === 'SaleEvent_name_key') {
      return NextResponse.json(
        { error: 'A sale event with this name already exists. Please use a different name.' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
  }
}
