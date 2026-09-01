import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCustomerFromRequest } from '@/lib/customerAccount';

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

export async function GET(request: Request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const addresses = await prisma.savedAddress.findMany({
      where: { userId: customer.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ success: true, addresses });
  } catch (error) {
    console.error('Customer addresses load failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to load saved addresses.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const parsed = parseAddress(await request.json());
    if ('error' in parsed) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const addressCount = await prisma.savedAddress.count({ where: { userId: customer.id } });
    if (addressCount >= 10) {
      return NextResponse.json({ success: false, error: 'You can save up to 10 addresses.' }, { status: 400 });
    }

    const shouldBeDefault = parsed.data.isDefault || addressCount === 0;
    if (shouldBeDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: customer.id, isDefault: true },
        data: { isDefault: false },
      });
    }
    const address = await prisma.savedAddress.create({
      data: {
        ...parsed.data,
        isDefault: shouldBeDefault,
        userId: customer.id,
      },
    });
    return NextResponse.json({ success: true, address }, { status: 201 });
  } catch (error) {
    console.error('Customer address creation failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to save the address.' }, { status: 500 });
  }
}
