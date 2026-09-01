import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { isAdminRequest } from '@/lib/adminAuth';
import { sendEmail } from '@/lib/email';
import type { StoredOrderStatus } from '@/lib/orderStatus';

const paymentStatuses = ['APPROVED', 'DISAPPROVED', 'PENDING'] as const;
const orderActions = ['CONFIRM', 'SHIP', 'DELIVER', 'CANCEL'] as const;

type PaymentStatus = (typeof paymentStatuses)[number];
type OrderAction = (typeof orderActions)[number];
type EmailMeta = { title: string; message: string };

class OrderTransitionError extends Error {
  constructor(message: string, readonly status = 409) {
    super(message);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function itemRecords(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === 'object' && !Array.isArray(item),
  );
}

function variantRecords(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (variant): variant is Record<string, unknown> =>
      Boolean(variant) && typeof variant === 'object' && !Array.isArray(variant),
  );
}

function stockValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function buildStatusEmail(
  order: {
    id: string;
    subtotal: number;
    discountAmount: number;
    shippingCost: number;
    total: number;
    items: unknown;
    shippingCity: string;
    shippingRegion: string;
    adminNote: string | null;
  },
  { title, message }: EmailMeta,
) {
  const itemsHtml = itemRecords(order.items)
    .map((item) => {
      const name = escapeHtml(String(item.name || 'Product'));
      const size = item.size ? ` (Size: ${escapeHtml(String(item.size))})` : '';
      const color = item.color ? ` (Color: ${escapeHtml(String(item.color))})` : '';
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const price = Number(item.price) || 0;
      return `<li>${name}${size}${color} × ${quantity} — Rs. ${(price * quantity).toFixed(2)}</li>`;
    })
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:640px;margin:auto">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(message)}</p>
      <p><strong>Order ID:</strong> ${escapeHtml(order.id)}</p>
      <p><strong>Subtotal:</strong> Rs. ${Number(order.subtotal).toFixed(2)}</p>
      <p><strong>Discount:</strong> Rs. ${Number(order.discountAmount).toFixed(2)}</p>
      <p><strong>Shipping:</strong> Rs. ${Number(order.shippingCost).toFixed(2)}</p>
      <p><strong>Total:</strong> Rs. ${Number(order.total).toFixed(2)}</p>
      <h3>Items</h3>
      <ul>${itemsHtml}</ul>
      <p><strong>Shipping to:</strong> ${escapeHtml(order.shippingCity)}, ${escapeHtml(order.shippingRegion)}</p>
      ${order.adminNote ? `<p><strong>Admin note:</strong> ${escapeHtml(order.adminNote)}</p>` : ''}
      <p>Thank you for shopping with Step & Styl.</p>
    </div>
  `;
}

function normalizeAction(value: unknown): OrderAction | null {
  if (value === 'OUT_FOR_DELIVERY') return 'SHIP';
  if (value === 'DELIVERED') return 'DELIVER';
  return typeof value === 'string' && orderActions.includes(value as OrderAction)
    ? value as OrderAction
    : null;
}

function nextStatus(action: OrderAction): StoredOrderStatus {
  if (action === 'CONFIRM') return 'PAID';
  if (action === 'SHIP') return 'SHIPPED';
  if (action === 'DELIVER') return 'COMPLETED';
  return 'CANCELLED';
}

function validateTransition(
  status: StoredOrderStatus,
  action: OrderAction,
  paymentMethod: string,
  paymentStatus: string,
  note: string,
) {
  if (status === 'COMPLETED') {
    throw new OrderTransitionError('Delivered orders cannot be changed.');
  }
  if (status === 'CANCELLED') {
    throw new OrderTransitionError('Cancelled orders cannot be changed.');
  }
  if (action === 'CONFIRM' && status !== 'PENDING') {
    throw new OrderTransitionError('Only pending orders can be confirmed.');
  }
  if (action === 'SHIP' && status !== 'PAID') {
    throw new OrderTransitionError('Confirm the order before marking it as shipped.');
  }
  if (action === 'DELIVER' && status !== 'SHIPPED') {
    throw new OrderTransitionError('Only shipped orders can be marked as delivered.');
  }
  if (action === 'DELIVER' && paymentStatus !== 'APPROVED') {
    throw new OrderTransitionError('Approve or record payment before marking this order as delivered.');
  }
  if (action === 'CANCEL' && status !== 'PENDING' && status !== 'PAID') {
    throw new OrderTransitionError('Only pending or confirmed orders can be cancelled.');
  }
  if (action === 'CANCEL' && !note) {
    throw new OrderTransitionError('A cancellation reason is required.', 400);
  }
  if (
    (action === 'CONFIRM' || action === 'SHIP') &&
    (paymentMethod === 'DIRECT' || paymentMethod === 'CARD') &&
    paymentStatus !== 'APPROVED'
  ) {
    throw new OrderTransitionError('Approve prepaid payment before confirming this order.');
  }
}

async function applyShipmentStock(
  transaction: Prisma.TransactionClient,
  items: unknown,
) {
  const requirements = new Map<
    string,
    { productId: string; color: string; size: string; quantity: number }
  >();

  for (const item of itemRecords(items)) {
    const productId = typeof item.id === 'string' ? item.id : '';
    if (!productId) continue;
    const color = typeof item.color === 'string' ? item.color.trim() : '';
    const size = typeof item.size === 'string' ? item.size.trim() : '';
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const key = `${productId}::${color.toLowerCase()}::${size.toLowerCase()}`;
    const existing = requirements.get(key);
    requirements.set(key, {
      productId,
      color,
      size,
      quantity: (existing?.quantity || 0) + quantity,
    });
  }

  if (requirements.size === 0) return;
  const productIds = Array.from(new Set(Array.from(requirements.values()).map((item) => item.productId)));
  const products = await transaction.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, variants: true },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));
  const requirementsByProduct = new Map<string, Array<{ color: string; size: string; quantity: number }>>();

  for (const requirement of requirements.values()) {
    const list = requirementsByProduct.get(requirement.productId) || [];
    list.push(requirement);
    requirementsByProduct.set(requirement.productId, list);
  }

  for (const [productId, productRequirements] of requirementsByProduct) {
    const product = productMap.get(productId);
    if (!product) {
      throw new OrderTransitionError('An ordered product no longer exists. Resolve the order before shipping.');
    }
    const variants = variantRecords(product.variants);
    if (variants.length === 0) continue;

    const nextVariants = variants.map((variant) => ({ ...variant }));
    for (const requirement of productRequirements) {
      const variantIndex = nextVariants.findIndex(
        (variant) =>
          String(variant.color || '').toLowerCase() === requirement.color.toLowerCase() &&
          String(variant.size || '').toLowerCase() === requirement.size.toLowerCase(),
      );
      if (variantIndex < 0) {
        throw new OrderTransitionError(
          `${product.title}: ordered variant ${requirement.color || 'default'} / ${requirement.size || 'one size'} no longer exists.`,
        );
      }
      const available = stockValue(nextVariants[variantIndex].stock);
      if (available < requirement.quantity) {
        throw new OrderTransitionError(
          `${product.title}: only ${available} units are available for ${requirement.color} / ${requirement.size}; ${requirement.quantity} required.`,
        );
      }
      nextVariants[variantIndex].stock = available - requirement.quantity;
    }

    await transaction.product.update({
      where: { id: productId },
      data: {
        variants: nextVariants as Prisma.InputJsonValue,
        inStock: nextVariants.some((variant) => stockValue(variant.stock) > 0),
        saleCount: {
          increment: productRequirements.reduce((sum, requirement) => sum + requirement.quantity, 0),
        },
      },
    });
  }
}

const orderInclude = {
  promoCode: { select: { code: true, discountPercent: true } },
  user: { select: { email: true, name: true } },
} satisfies Prisma.OrderInclude;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const token =
      request.cookies.get(AUTH_COOKIE_NAME)?.value ||
      request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const payload = token ? await verifyAuthToken(token) : null;
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    if (payload.role !== 'ADMIN' && order.userId !== payload.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const paymentStatus = paymentStatuses.includes(body?.paymentStatus)
      ? body.paymentStatus as PaymentStatus
      : null;
    const action = normalizeAction(body?.action);
    const adminNote = typeof body?.adminNote === 'string'
      ? body.adminNote.trim().slice(0, 1000)
      : '';

    if (body?.paymentStatus !== undefined && !paymentStatus) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment status.' },
        { status: 400 },
      );
    }
    if (body?.action !== undefined && !action) {
      return NextResponse.json(
        { success: false, error: 'Invalid order action.' },
        { status: 400 },
      );
    }
    if ((!paymentStatus && !action) || (paymentStatus && action)) {
      return NextResponse.json(
        { success: false, error: 'Submit one payment update or one order action.' },
        { status: 400 },
      );
    }

    const currentOrder = await prisma.order.findUnique({ where: { id } });
    if (!currentOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    let emailMeta: EmailMeta | null = null;
    let order;

    if (paymentStatus) {
      if (currentOrder.status === 'CANCELLED' || currentOrder.status === 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'Payment cannot be changed for a cancelled or delivered order.' },
          { status: 409 },
        );
      }
      if (paymentStatus === 'DISAPPROVED' && !adminNote) {
        return NextResponse.json(
          { success: false, error: 'Please provide a reason when disapproving payment.' },
          { status: 400 },
        );
      }
      if (paymentStatus === 'DISAPPROVED' && currentOrder.status === 'SHIPPED') {
        return NextResponse.json(
          { success: false, error: 'Shipped orders cannot have payment disapproved.' },
          { status: 409 },
        );
      }

      order = await prisma.order.update({
        where: { id },
        data: {
          paymentStatus,
          adminNote: adminNote || null,
          approvedAt: paymentStatus === 'APPROVED' ? new Date() : null,
          disapprovedAt: paymentStatus === 'DISAPPROVED' ? new Date() : null,
          status: paymentStatus === 'DISAPPROVED' ? 'CANCELLED' : undefined,
        },
        include: orderInclude,
      });
      emailMeta = paymentStatus === 'APPROVED'
        ? {
            title: 'Payment approved',
            message: 'Your payment has been verified. Your order is ready for confirmation.',
          }
        : paymentStatus === 'DISAPPROVED'
          ? {
              title: 'Payment could not be verified',
              message: `Your order has been cancelled because the payment could not be verified. Reason: ${adminNote}`,
            }
          : null;
    } else {
      validateTransition(
        currentOrder.status,
        action!,
        currentOrder.paymentMethod,
        currentOrder.paymentStatus,
        adminNote,
      );

      const updateData: Prisma.OrderUpdateInput = {
        status: nextStatus(action!),
        adminNote: adminNote || undefined,
      };
      if (action === 'SHIP') {
        order = await prisma.$transaction(async (transaction) => {
          await applyShipmentStock(transaction, currentOrder.items);
          return transaction.order.update({ where: { id }, data: updateData, include: orderInclude });
        });
      } else {
        order = await prisma.order.update({ where: { id }, data: updateData, include: orderInclude });
      }

      if (action === 'CONFIRM') {
        emailMeta = {
          title: 'Order confirmed',
          message: 'Your order has been confirmed and is being prepared for shipment.',
        };
      } else if (action === 'SHIP') {
        emailMeta = {
          title: 'Order shipped',
          message: 'Your order has been shipped and is on its way.',
        };
      } else if (action === 'DELIVER') {
        emailMeta = {
          title: 'Order delivered',
          message: 'Your order has been delivered. We hope you enjoy your purchase!',
        };
      } else {
        emailMeta = {
          title: 'Order cancelled',
          message: `Your order has been cancelled. Reason: ${adminNote}`,
        };
      }
    }

    let emailSent: boolean | null = null;
    if (emailMeta) {
      emailSent = await sendEmail({
        to: order.shippingEmail,
        subject: emailMeta.title,
        html: buildStatusEmail(order, emailMeta),
      }).catch((emailError) => {
        console.error('Order status email failed:', emailError);
        return false;
      });
    }

    return NextResponse.json({
      success: true,
      order,
      emailSent,
      warning: emailMeta && !emailSent
        ? 'Order updated, but customer email could not be sent. Check SMTP configuration.'
        : null,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    if (error instanceof OrderTransitionError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 },
    );
  }
}
