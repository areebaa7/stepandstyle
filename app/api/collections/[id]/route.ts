import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // Verify admin
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const payload = token ? await verifyAuthToken(token) : null;
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, slug, description, image, targetGender } = await request.json();

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        name,
        slug: slug?.toLowerCase(),
        description,
        image,
        targetGender,
      },
    });

    return NextResponse.json({ success: true, collection });
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ success: false, error: 'Failed to update collection' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // Verify admin
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    const payload = token ? await verifyAuthToken(token) : null;
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if products are using this collection
    const productCount = await prisma.product.count({
      where: { collectionId: id },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete collection that has products' },
        { status: 400 }
      );
    }

    await prisma.collection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Collection deleted' });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete collection' }, { status: 500 });
  }
}
