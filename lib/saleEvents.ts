import { prisma } from '@/lib/prisma';

/**
 * Recomputes product discounts from all sale events.
 * - Resets every product that any sale event (past or present) has targeted
 * - Applies the highest discount percent among all ACTIVE events covering a product
 * - Leaves manually-set discounts on non-targeted products untouched
 *
 * Uses batched queries so the whole recompute stays constant-time
 * regardless of how many products are targeted.
 */
export async function applySaleDiscounts() {
  const events = await prisma.saleEvent.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const targetedCollectionIds = new Set<string>();
  const directlyTargetedIds = new Set<string>();
  for (const event of events) {
    for (const collectionId of (event.targetCollections as string[]) || []) {
      targetedCollectionIds.add(collectionId);
    }
    for (const productId of (event.targetProducts as string[]) || []) {
      directlyTargetedIds.add(productId);
    }
  }

  if (targetedCollectionIds.size === 0 && directlyTargetedIds.size === 0) return;

  // 1. Resolve which products actually exist and are targeted
  const [collectionProducts, directProducts] = await Promise.all([
    targetedCollectionIds.size > 0
      ? prisma.product.findMany({
          where: { collectionId: { in: [...targetedCollectionIds] } },
          select: { id: true, collectionId: true },
        })
      : Promise.resolve([]),
    directlyTargetedIds.size > 0
      ? prisma.product.findMany({
          where: { id: { in: [...directlyTargetedIds] } },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const targetIds = new Set([
    ...collectionProducts.map((p) => p.id),
    ...directProducts.map((p) => p.id),
  ]);

  if (targetIds.size === 0) return;

  // 2. Reset all targeted products
  await prisma.product.updateMany({
    where: { id: { in: [...targetIds] } },
    data: { discount: 0 },
  });

  // 3. Compute the highest percent per product across active events
  const coverage = new Map<string, number>();
  for (const product of collectionProducts) {
    if (!product.collectionId) continue;
    let max = 0;
    for (const event of events) {
      if (
        event.isActive &&
        ((event.targetCollections as string[]) || []).includes(product.collectionId)
      ) {
        max = Math.max(max, Number(event.discountPercent) || 0);
      }
    }
    if (max > 0) coverage.set(product.id, max);
  }

  const directIdSet = new Set(directProducts.map((p) => p.id));
  for (const productId of directIdSet) {
    let max = coverage.get(productId) || 0;
    for (const event of events) {
      if (
        event.isActive &&
        ((event.targetProducts as string[]) || []).includes(productId)
      ) {
        max = Math.max(max, Number(event.discountPercent) || 0);
      }
    }
    if (max > 0) coverage.set(productId, max);
  }

  // 4. Apply in one batched update per distinct percent value
  const byPercent = new Map<number, string[]>();
  for (const [id, percent] of coverage) {
    const ids = byPercent.get(percent) || [];
    ids.push(id);
    byPercent.set(percent, ids);
  }

  for (const [percent, ids] of byPercent) {
    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { discount: percent },
    });
  }
}
