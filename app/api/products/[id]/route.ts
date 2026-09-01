import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { ensureProductsSeeded, serializeProduct } from '@/lib/products';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';
import { parseProductPayload } from '@/lib/productValidation';

function toJsonInput(value: unknown) {
  return value === undefined ? undefined : (value as Prisma.InputJsonValue);
}

async function requireAdmin(request: NextRequest) {
  const token =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    null;

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);
  if (!payload || payload.role !== 'ADMIN') {
    return null;
  }

  return payload;
}

// GET /api/products/[slug]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await ensureProductsSeeded();
    const params = await context.params;
    const slug = params.id;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { collection: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serializeProduct(product) });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT /api/products/[slug]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const params = await context.params;
    const slug = params.id;
    const body = await request.json();
    const { data, error } = parseProductPayload(body, { requireSlug: false, allowPartial: true });

    if (error) {
      console.warn('Product update validation failed:', error, 'Payload:', body);
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    // Prevent slug updates via this endpoint
    if (data.slug) {
      delete data.slug;
    }

    const product = await prisma.product.update({
      where: { slug },
      data: {
        category: data.category ?? undefined, title: data.title ?? undefined,
        description: data.description ?? undefined,
        shortDescription: data.shortDescription ?? undefined,
        price: data.price ?? undefined,
        salePrice: data.salePrice ?? undefined,
        discount: data.discount ?? undefined,
        inStock: data.inStock ?? undefined,
        image: data.image === undefined ? undefined : data.image,
        images: data.images === undefined ? undefined : data.images,
        colors: data.colors === undefined ? undefined : data.colors,
        videoUrl: data.videoUrl === undefined ? undefined : data.videoUrl,
        advantages: toJsonInput(data.advantages),
        specifications: toJsonInput(data.specifications),
        features: toJsonInput(data.features),
        variants: toJsonInput(data.variants),
        collectionId: data.collectionId === undefined ? undefined : data.collectionId,
      },
      include: { collection: true },
    });

    return NextResponse.json({
      success: true,
      data: serializeProduct(product),
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/products/[slug]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const params = await context.params;
    const slug = params.id;

    await prisma.product.delete({
      where: { slug },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 });
  }
}

