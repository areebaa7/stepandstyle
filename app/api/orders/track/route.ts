import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId')?.trim();
    const identifier = searchParams.get('identifier')?.trim().toLowerCase();

    if (!orderId || !identifier) {
      return NextResponse.json(
        { success: false, error: 'Please provide both Order ID and Email/Phone number.' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { id: { startsWith: orderId } },
        ],
      },
      select: {
        id: true,
        subtotal: true,
        discountAmount: true,
        shippingCost: true,
        total: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        shippingName: true,
        shippingEmail: true,
        shippingPhone: true,
        shippingAddress: true,
        shippingCity: true,
        shippingRegion: true,
        items: true,
        createdAt: true,
        updatedAt: true,
        approvedAt: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'No order found with the provided Order ID.' },
        { status: 404 }
      );
    }

    // Verify security: identifier must match shippingEmail or shippingPhone
    const emailMatch = order.shippingEmail?.trim().toLowerCase() === identifier;
    const phoneMatch = order.shippingPhone?.replaceAll(/\s+/g, '') === identifier.replaceAll(/\s+/g, '');

    if (!emailMatch && !phoneMatch) {
      return NextResponse.json(
        { success: false, error: 'The email or phone number does not match this Order ID.' },
        { status: 403 }
      );
    }

    // Calculate Progress Step (1: Placed, 2: Approved/Paid, 3: Shipped, 4: Delivered)
    let currentStep = 1;
    if (order.status === 'COMPLETED') {
      currentStep = 4;
    } else if (order.status === 'SHIPPED') {
      currentStep = 3;
    } else if (order.paymentStatus === 'APPROVED' || order.status === 'PAID') {
      currentStep = 2;
    } else if (order.status === 'CANCELLED') {
      currentStep = 0;
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        shippingCost: order.shippingCost,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        shippingName: order.shippingName,
        shippingEmail: order.shippingEmail,
        shippingCity: order.shippingCity,
        shippingAddress: order.shippingAddress,
        items: order.items,
        createdAt: order.createdAt,
        approvedAt: order.approvedAt,
        currentStep,
      },
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while tracking your order.' },
      { status: 500 }
    );
  }
}
