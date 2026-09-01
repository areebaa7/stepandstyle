import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';
import { normalizeReelData, ReelValidationError } from '@/lib/reelValidation';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.homeReel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Reel not found.' }, { status: 404 });
    }

    const data = normalizeReelData(await request.json(), true);
    const reel = await prisma.homeReel.update({ where: { id }, data });
    return NextResponse.json({ success: true, reel });
  } catch (error) {
    const validationError = error instanceof ReelValidationError;
    console.error('Error updating reel:', error);
    return NextResponse.json(
      { success: false, error: validationError ? error.message : 'Failed to update reel.' },
      { status: validationError ? 400 : 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.homeReel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Reel not found.' }, { status: 404 });
    }

    await prisma.homeReel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reel:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete reel.' }, { status: 500 });
  }
}
