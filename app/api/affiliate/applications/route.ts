import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

function isApplicationStatus(value: string | null): value is ApplicationStatus {
  return value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED';
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuthToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const where = isApplicationStatus(status) ? { status } : {};

    const applications = await prisma.affiliateApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching affiliate applications:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
