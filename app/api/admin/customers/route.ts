import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';

type VerificationFilter = 'ALL' | 'VERIFIED' | 'UNVERIFIED';
type CustomerSort = 'LATEST' | 'OLDEST' | 'SPEND' | 'ORDERS' | 'NAME';

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function integerParam(value: string | null, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

function verificationFilter(value: string | null): VerificationFilter {
  return value === 'VERIFIED' || value === 'UNVERIFIED' ? value : 'ALL';
}

function customerSort(value: string | null): CustomerSort {
  return value === 'OLDEST' || value === 'SPEND' || value === 'ORDERS' || value === 'NAME'
    ? value
    : 'LATEST';
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const search = (searchParams.get('search') || '').trim().toLowerCase().slice(0, 100);
    const verification = verificationFilter(searchParams.get('verification'));
    const sort = customerSort(searchParams.get('sort'));
    const page = integerParam(searchParams.get('page'), 1, 1, 100000);
    const pageSize = integerParam(searchParams.get('pageSize'), 20, 5, 100);

    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            total: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
            savedAddresses: true,
          },
        },
      },
    });

    const customers = users.map((user) => {
      const completedOrders = user.orders.filter((order) => order.status === 'COMPLETED');
      const totalSpent = completedOrders.reduce(
        (sum, order) => sum + numberValue(order.total),
        0,
      );
      const openOrders = user.orders.filter(
        (order) => order.status !== 'COMPLETED' && order.status !== 'CANCELLED',
      ).length;
      const lastOrderAt = user.orders.reduce<Date | null>(
        (latest, order) => (!latest || order.createdAt > latest ? order.createdAt : latest),
        null,
      );

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        orderCount: user._count.orders,
        completedOrders: completedOrders.length,
        openOrders,
        addressCount: user._count.savedAddresses,
        totalSpent,
        averageOrderValue: completedOrders.length ? totalSpent / completedOrders.length : 0,
        lastOrderAt,
      };
    });

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const summary = {
      totalCustomers: customers.length,
      verifiedCustomers: customers.filter((customer) => customer.emailVerifiedAt).length,
      customersWithOrders: customers.filter((customer) => customer.orderCount > 0).length,
      newThisMonth: customers.filter((customer) => customer.createdAt >= monthStart).length,
      lifetimeRevenue: customers.reduce((sum, customer) => sum + customer.totalSpent, 0),
    };

    const filteredCustomers = customers.filter((customer) => {
      if (
        verification === 'VERIFIED' && !customer.emailVerifiedAt ||
        verification === 'UNVERIFIED' && customer.emailVerifiedAt
      ) {
        return false;
      }
      if (!search) return true;
      return (
        customer.email.toLowerCase().includes(search) ||
        (customer.name || '').toLowerCase().includes(search)
      );
    });

    filteredCustomers.sort((left, right) => {
      if (sort === 'OLDEST') return left.createdAt.getTime() - right.createdAt.getTime();
      if (sort === 'SPEND') return right.totalSpent - left.totalSpent;
      if (sort === 'ORDERS') return right.orderCount - left.orderCount;
      if (sort === 'NAME') return (left.name || left.email).localeCompare(right.name || right.email);
      return right.createdAt.getTime() - left.createdAt.getTime();
    });

    const total = filteredCustomers.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;

    return NextResponse.json({
      success: true,
      data: filteredCustomers.slice(start, start + pageSize),
      summary,
      pagination: {
        page: currentPage,
        pageSize,
        total,
        totalPages,
      },
      filters: { search, verification, sort },
    });
  } catch (error) {
    console.error('Failed to load customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load customers.' },
      { status: 500 },
    );
  }
}
