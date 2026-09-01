import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/customerAccount';

type RouteContext = { params: Promise<{ id: string }> };

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function jsonItemCount(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

async function findCustomer(id: string) {
  const customer = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
      updatedAt: true,
      savedAddresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          label: true,
          fullName: true,
          phone: true,
          address: true,
          city: true,
          region: true,
          postalCode: true,
          isDefault: true,
          createdAt: true,
        },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          total: true,
          subtotal: true,
          discountAmount: true,
          shippingCost: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          shippingName: true,
          shippingEmail: true,
          shippingPhone: true,
          shippingCity: true,
          shippingRegion: true,
          createdAt: true,
          promoCode: { select: { code: true } },
        },
      },
      customerCart: { select: { items: true, promoCode: true, updatedAt: true } },
      customerWishlist: { select: { items: true, updatedAt: true } },
      _count: { select: { orders: true, savedAddresses: true } },
    },
  });

  return customer?.role === 'USER' ? customer : null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const customer = await findCustomer(id);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found.' },
        { status: 404 },
      );
    }

    const [completedAggregate, openOrderCount, cancelledOrderCount] = await Promise.all([
      prisma.order.aggregate({
        where: { userId: customer.id, status: 'COMPLETED' },
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { userId: customer.id, status: { in: ['PENDING', 'PAID', 'SHIPPED'] } },
      }),
      prisma.order.count({ where: { userId: customer.id, status: 'CANCELLED' } }),
    ]);
    const completedOrderCount = completedAggregate._count.id;
    const totalSpent = numberValue(completedAggregate._sum.total);

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          emailVerifiedAt: customer.emailVerifiedAt,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        },
        summary: {
          totalOrders: customer._count.orders,
          completedOrders: completedOrderCount,
          openOrders: openOrderCount,
          cancelledOrders: cancelledOrderCount,
          totalSpent,
          averageOrderValue: completedOrderCount ? totalSpent / completedOrderCount : 0,
          addressCount: customer._count.savedAddresses,
          cartItemCount: jsonItemCount(customer.customerCart?.items),
          wishlistItemCount: jsonItemCount(customer.customerWishlist?.items),
        },
        addresses: customer.savedAddresses,
        orders: customer.orders,
        cart: customer.customerCart
          ? {
              itemCount: jsonItemCount(customer.customerCart.items),
              promoCode: customer.customerCart.promoCode,
              updatedAt: customer.customerCart.updatedAt,
            }
          : null,
        wishlist: customer.customerWishlist
          ? {
              itemCount: jsonItemCount(customer.customerWishlist.items),
              updatedAt: customer.customerWishlist.updatedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Failed to load customer detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load customer detail.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const action = body?.action;
    if (action !== 'SEND_VERIFICATION' && action !== 'SEND_PASSWORD_RESET') {
      return NextResponse.json(
        { success: false, error: 'Unsupported customer action.' },
        { status: 400 },
      );
    }

    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
      },
    });
    if (!customer || customer.role !== 'USER') {
      return NextResponse.json(
        { success: false, error: 'Customer not found.' },
        { status: 404 },
      );
    }

    if (action === 'SEND_VERIFICATION' && customer.emailVerifiedAt) {
      return NextResponse.json(
        { success: false, error: 'This customer email is already verified.' },
        { status: 409 },
      );
    }

    const sent = action === 'SEND_VERIFICATION'
      ? await sendVerificationEmail(customer)
      : await sendPasswordResetEmail(customer);
    if (!sent) {
      return NextResponse.json(
        { success: false, error: 'Email could not be delivered. Check email configuration.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: action === 'SEND_VERIFICATION'
        ? 'Verification email sent successfully.'
        : 'Password reset email sent successfully.',
    });
  } catch (error) {
    console.error('Failed to perform customer action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform customer action.' },
      { status: 500 },
    );
  }
}
