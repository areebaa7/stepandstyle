import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';
import { applySaleDiscounts } from '@/lib/saleEvents';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const saleEvent = await prisma.saleEvent.findUnique({
      where: { id }
    });

    if (!saleEvent) {
      return NextResponse.json({ error: 'Sale event not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.name !== undefined) data.name = body.name;
    if (body.bannerText !== undefined) data.bannerText = body.bannerText;
    if (body.discountPercent !== undefined) data.discountPercent = body.discountPercent;
    if (body.targetCollections !== undefined) data.targetCollections = body.targetCollections;
    if (body.targetProducts !== undefined) data.targetProducts = body.targetProducts;

    const sale = await prisma.saleEvent.update({
      where: { id },
      data,
    });

    await applySaleDiscounts();

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
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.saleEvent.delete({
      where: { id },
    });

    await applySaleDiscounts();

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}
