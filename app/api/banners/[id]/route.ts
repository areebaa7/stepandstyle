import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';
import { BannerValidationError, normalizeBannerData } from '@/lib/bannerValidation';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const updateData = normalizeBannerData(await request.json(), true);
    const existingBanner = await prisma.banner.findUnique({ where: { id } });

    if (!existingBanner) {
      return NextResponse.json(
        { success: false, error: 'Banner not found.' },
        { status: 404 }
      );
    }

    const effectiveStartDate =
      updateData.startDate === undefined ? existingBanner.startDate : updateData.startDate;
    const effectiveEndDate =
      updateData.endDate === undefined ? existingBanner.endDate : updateData.endDate;

    if (effectiveStartDate && effectiveEndDate && effectiveStartDate > effectiveEndDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after the start date.' },
        { status: 400 }
      );
    }

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, banner: updatedBanner });
  } catch (error) {
    console.error('Error updating banner:', error);
    const isValidationError = error instanceof BannerValidationError;
    return NextResponse.json(
      {
        success: false,
        error: isValidationError ? error.message : 'Failed to update banner',
      },
      { status: isValidationError ? 400 : 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
