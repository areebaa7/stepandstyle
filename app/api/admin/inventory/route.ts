import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { isAdminRequest } from '@/lib/adminAuth';

type InventoryStatus = 'ALL' | 'LOW' | 'OUT' | 'HEALTHY' | 'NO_VARIANTS';

type InventoryVariant = {
  key: string;
  id: string | null;
  color: string;
  size: string;
  stock: number;
};

function stockValue(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function parseThreshold(value: string | null) {
  const number = Number.parseInt(value || '', 10);
  return Number.isInteger(number) ? Math.min(100, Math.max(1, number)) : 5;
}

function parseStatus(value: string | null): InventoryStatus {
  return value === 'LOW' || value === 'OUT' || value === 'HEALTHY' || value === 'NO_VARIANTS'
    ? value
    : 'ALL';
}

function rawVariants(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is Record<string, unknown> =>
      Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry),
  );
}

function inventoryVariants(value: unknown): InventoryVariant[] {
  return rawVariants(value).map((variant, index) => {
    const id = typeof variant.id === 'string' && variant.id ? variant.id : null;
    return {
      key: id || `index:${index}`,
      id,
      color: typeof variant.color === 'string' && variant.color.trim()
        ? variant.color.trim()
        : 'Default',
      size: typeof variant.size === 'string' && variant.size.trim()
        ? variant.size.trim()
        : 'One size',
      stock: stockValue(variant.stock),
    };
  });
}

function productInventoryStatus(
  variants: InventoryVariant[],
  inStock: boolean,
  threshold: number,
): Exclude<InventoryStatus, 'ALL'> {
  if (variants.length === 0) return inStock ? 'NO_VARIANTS' : 'OUT';
  const totalUnits = variants.reduce((sum, variant) => sum + variant.stock, 0);
  if (!inStock || totalUnits === 0) return 'OUT';
  if (variants.some((variant) => variant.stock <= threshold)) return 'LOW';
  return 'HEALTHY';
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const threshold = parseThreshold(request.nextUrl.searchParams.get('threshold'));
    const status = parseStatus(request.nextUrl.searchParams.get('status'));
    const search = (request.nextUrl.searchParams.get('search') || '')
      .trim()
      .toLowerCase()
      .slice(0, 100);

    const products = await prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        image: true,
        inStock: true,
        variants: true,
        updatedAt: true,
        collection: { select: { name: true } },
      },
      orderBy: { title: 'asc' },
    });

    const inventory = products.map((product) => {
      const variants = inventoryVariants(product.variants);
      const totalUnits = variants.reduce((sum, variant) => sum + variant.stock, 0);
      const lowStockVariants = variants.filter(
        (variant) => variant.stock > 0 && variant.stock <= threshold,
      ).length;
      const outOfStockVariants = variants.filter((variant) => variant.stock === 0).length;
      const inventoryStatus = productInventoryStatus(variants, product.inStock, threshold);
      const availabilityMismatch = variants.length > 0 && product.inStock !== (totalUnits > 0);

      return {
        id: product.id,
        slug: product.slug,
        title: product.title,
        image: product.image,
        collectionName: product.collection?.name || null,
        inStock: product.inStock,
        status: inventoryStatus,
        totalUnits,
        variantCount: variants.length,
        lowStockVariants,
        outOfStockVariants,
        availabilityMismatch,
        variants,
        updatedAt: product.updatedAt,
      };
    });

    const summary = {
      totalProducts: inventory.length,
      totalUnits: inventory.reduce((sum, product) => sum + product.totalUnits, 0),
      lowStockProducts: inventory.filter((product) => product.status === 'LOW').length,
      outOfStockProducts: inventory.filter((product) => product.status === 'OUT').length,
      lowStockVariants: inventory.reduce((sum, product) => sum + product.lowStockVariants, 0),
      outOfStockVariants: inventory.reduce((sum, product) => sum + product.outOfStockVariants, 0),
      availabilityMismatches: inventory.filter((product) => product.availabilityMismatch).length,
      productsWithoutVariants: inventory.filter((product) => product.variantCount === 0).length,
    };

    const filtered = inventory
      .filter((product) => {
        if (status !== 'ALL' && product.status !== status) return false;
        if (!search) return true;
        return (
          product.title.toLowerCase().includes(search) ||
          product.slug.toLowerCase().includes(search) ||
          (product.collectionName || '').toLowerCase().includes(search)
        );
      })
      .sort((left, right) => {
        const rank = { OUT: 0, LOW: 1, NO_VARIANTS: 2, HEALTHY: 3 } as const;
        return rank[left.status] - rank[right.status] || left.title.localeCompare(right.title);
      });

    return NextResponse.json({
      success: true,
      data: filtered,
      summary,
      threshold,
      filters: { status, search },
    });
  } catch (error) {
    console.error('Failed to load inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load inventory.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const productId = typeof body?.productId === 'string' ? body.productId : '';
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required.' },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, variants: true, inStock: true },
    });
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found.' },
        { status: 404 },
      );
    }

    if (body.action === 'SET_AVAILABILITY') {
      const variants = rawVariants(product.variants);
      if (variants.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Variant products derive availability from their stock quantities.' },
          { status: 409 },
        );
      }
      if (typeof body.inStock !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Availability must be true or false.' },
          { status: 400 },
        );
      }
      await prisma.product.update({
        where: { id: productId },
        data: { inStock: body.inStock },
      });
      return NextResponse.json({
        success: true,
        message: 'Product availability updated.',
      });
    }

    if (body.action !== 'UPDATE_VARIANT_STOCK') {
      return NextResponse.json(
        { success: false, error: 'Unsupported inventory action.' },
        { status: 400 },
      );
    }

    const variantKey = typeof body.variantKey === 'string' ? body.variantKey : '';
    const stock = Number(body.stock);
    if (!variantKey) {
      return NextResponse.json(
        { success: false, error: 'Variant key is required.' },
        { status: 400 },
      );
    }
    if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) {
      return NextResponse.json(
        { success: false, error: 'Stock must be a whole number between 0 and 1,000,000.' },
        { status: 400 },
      );
    }

    const variants = rawVariants(product.variants);
    const index = variants.findIndex((variant, variantIndex) => {
      const id = typeof variant.id === 'string' && variant.id ? variant.id : null;
      return (id || `index:${variantIndex}`) === variantKey;
    });
    if (index < 0) {
      return NextResponse.json(
        { success: false, error: 'Product variant not found.' },
        { status: 404 },
      );
    }

    const nextVariants = variants.map((variant, variantIndex) =>
      variantIndex === index ? { ...variant, stock } : variant,
    );
    const hasAvailableStock = nextVariants.some((variant) => stockValue(variant.stock) > 0);
    await prisma.product.update({
      where: { id: productId },
      data: {
        variants: nextVariants as Prisma.InputJsonValue,
        inStock: hasAvailableStock,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Variant stock updated successfully.',
      data: { productId, variantKey, stock, inStock: hasAvailableStock },
    });
  } catch (error) {
    console.error('Failed to update inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update inventory.' },
      { status: 500 },
    );
  }
}
