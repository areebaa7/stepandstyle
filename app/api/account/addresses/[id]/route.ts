import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerFromRequest } from '@/lib/customerAccount';

type RouteContext = { params: Promise<{ id: string }> };

function parseAddress(body: unknown) {
  const values = body && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {};
  const address = {
    label: typeof values.label === 'string' ? values.label.trim().slice(0, 40) : '',
    fullName: typeof values.fullName === 'string' ? values.fullName.trim().slice(0, 100) : '',
    phone: typeof values.phone === 'string' ? values.phone.trim().slice(0, 30) : '',
    address: typeof values.address === 'string' ? values.address.trim().slice(0, 250) : '',
    city: typeof values.city === 'string' ? values.city.trim().slice(0, 100) : '',
    region: typeof values.region === 'string' ? values.region.trim().slice(0, 100) : '',
    postalCode: typeof values.postalCode === 'string' ? values.postalCode.trim().slice(0, 20) : '',
    isDefault: values.isDefault === true,
  };

  if (!address.label || !address.fullName || !address.phone || !address.address || !address.city || !address.region) {
    return { error: 'Label, name, phone, address, city and region are required.' } as const;
  }
  return { data: address } as const;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;
    const existing = await prisma.savedAddress.findFirst({ where: { id, userId: customer.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Address not found.' }, { status: 404 });
    }
    const parsed = parseAddress(await request.json());
    if ('error' in parsed) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    if (parsed.data.isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: customer.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    const address = await prisma.savedAddress.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error('Customer address update failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to update the address.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await context.params;
    const existing = await prisma.savedAddress.findFirst({ where: { id, userId: customer.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Address not found.' }, { status: 404 });
    }
    await prisma.savedAddress.delete({ where: { id } });

    if (existing.isDefault) {
      const replacement = await prisma.savedAddress.findFirst({
        where: { userId: customer.id },
        orderBy: { createdAt: 'desc' },
      });
      if (replacement) {
        await prisma.savedAddress.update({ where: { id: replacement.id }, data: { isDefault: true } });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Customer address deletion failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to delete the address.' }, { status: 500 });
  }
}
