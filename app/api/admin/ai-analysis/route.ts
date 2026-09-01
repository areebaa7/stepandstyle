import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        collection: { select: { id: true, name: true, targetGender: true } },
      },
    });

    const orders = await prisma.order.findMany({
      select: {
        id: true,
        total: true,
        status: true,
        paymentStatus: true,
        items: true,
        createdAt: true,
      },
    });

    // Process Product Sales & Revenue
    const productStatsMap: Record<string, { unitsSold: number; revenue: number }> = {};

    orders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const prodId = item.id || item.productId;
        const qty = Number(item.quantity || item.qty || 1);
        const price = Number(item.price || 0);

        if (prodId) {
          if (!productStatsMap[prodId]) {
            productStatsMap[prodId] = { unitsSold: 0, revenue: 0 };
          }
          productStatsMap[prodId].unitsSold += qty;
          productStatsMap[prodId].revenue += price * qty;
        }
      });
    });

    // Enrich Products with Stats
    const enrichedProducts = products.map((prod) => {
      const stats = productStatsMap[prod.id] || { unitsSold: prod.saleCount || 0, revenue: (prod.saleCount || 0) * prod.price };
      
      let totalStock = 0;
      let variantCount = 0;
      let lowStockVariants: string[] = [];

      if (Array.isArray(prod.variants)) {
        variantCount = prod.variants.length;
        prod.variants.forEach((v: any) => {
          const stock = Number(v.stock || 0);
          totalStock += stock;
          if (stock > 0 && stock <= 3) {
            lowStockVariants.push(`${v.color || ''} (${v.size || ''}): ${stock} left`);
          }
        });
      }

      return {
        id: prod.id,
        name: prod.title,
        slug: prod.slug,
        price: prod.price,
        image: prod.image,
        inStock: prod.inStock,
        totalStock: variantCount > 0 ? totalStock : (prod.inStock ? 15 : 0),
        variantCount,
        lowStockVariants,
        unitsSold: stats.unitsSold,
        revenue: stats.revenue,
        rating: prod.rating,
        collectionName: prod.collection?.name || 'Unassigned',
        createdAt: prod.createdAt,
      };
    });

    // Best Sellers (by Units & Revenue)
    const bestSellersByUnits = [...enrichedProducts]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    const bestSellersByRevenue = [...enrichedProducts]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Low Stock & Out of Stock Alerts
    const outOfStockProducts = enrichedProducts.filter((p) => !p.inStock || p.totalStock === 0);
    const lowStockProducts = enrichedProducts.filter(
      (p) => p.inStock && p.totalStock > 0 && (p.totalStock <= 5 || p.lowStockVariants.length > 0)
    );

    // Slow Moving Products (older than 7 days, <= 2 units sold)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const slowMovingProducts = enrichedProducts
      .filter((p) => p.unitsSold <= 2 && new Date(p.createdAt) < sevenDaysAgo)
      .slice(0, 5);

    // Collection Revenue & Units Breakdown
    const collectionBreakdownMap: Record<string, { collectionName: string; unitsSold: number; revenue: number; productCount: number }> = {};
    enrichedProducts.forEach((prod) => {
      const colName = prod.collectionName;
      if (!collectionBreakdownMap[colName]) {
        collectionBreakdownMap[colName] = { collectionName: colName, unitsSold: 0, revenue: 0, productCount: 0 };
      }
      collectionBreakdownMap[colName].unitsSold += prod.unitsSold;
      collectionBreakdownMap[colName].revenue += prod.revenue;
      collectionBreakdownMap[colName].productCount += 1;
    });
    const collectionBreakdown = Object.values(collectionBreakdownMap);

    // Generate AI Recommendations & Insights
    const aiRecommendations: Array<{ id: string; type: 'URGENT' | 'OPPORTUNITY' | 'PROMOTION' | 'HEALTH'; title: string; description: string; action: string }> = [];

    if (outOfStockProducts.length > 0) {
      aiRecommendations.push({
        id: 'out-of-stock-alert',
        type: 'URGENT',
        title: `${outOfStockProducts.length} Product(s) Out of Stock`,
        description: `Items like "${outOfStockProducts[0].name}" are out of stock. Replenishing inventory will prevent missed customer sales.`,
        action: 'Restock Immediately',
      });
    }

    if (lowStockProducts.length > 0) {
      aiRecommendations.push({
        id: 'low-stock-alert',
        type: 'URGENT',
        title: `${lowStockProducts.length} Product(s) Running Low on Stock`,
        description: `Fast-selling items like "${lowStockProducts[0].name}" have fewer than 5 units left across popular variants.`,
        action: 'Order Replenishment',
      });
    }

    if (bestSellersByUnits.length > 0 && bestSellersByUnits[0].unitsSold > 0) {
      aiRecommendations.push({
        id: 'top-performer-boost',
        type: 'OPPORTUNITY',
        title: `Top Performer: "${bestSellersByUnits[0].name}"`,
        description: `This product has generated Rs ${bestSellersByUnits[0].revenue.toLocaleString()} in revenue. Consider featuring it on the homepage carousel or running a social media ad campaign.`,
        action: 'Promote on Homepage',
      });
    }

    if (slowMovingProducts.length > 0) {
      aiRecommendations.push({
        id: 'slow-mover-discount',
        type: 'PROMOTION',
        title: `Clearance Candidate: "${slowMovingProducts[0].name}"`,
        description: `This product has low sales velocity. Consider applying a 15-20% discount or including it in the Seasonal Sale Event to unlock tied-up capital.`,
        action: 'Create Sale Discount',
      });
    }

    // Calculate Overall Inventory Health Score (0-100)
    const totalProducts = enrichedProducts.length;
    const healthyProductsCount = totalProducts - (outOfStockProducts.length + slowMovingProducts.length);
    const healthScore = totalProducts > 0 ? Math.round((healthyProductsCount / totalProducts) * 100) : 100;

    return NextResponse.json({
      success: true,
      summary: {
        totalProducts,
        healthScore,
        outOfStockCount: outOfStockProducts.length,
        lowStockCount: lowStockProducts.length,
        slowMovingCount: slowMovingProducts.length,
        totalRevenue: enrichedProducts.reduce((acc, p) => acc + p.revenue, 0),
        totalUnitsSold: enrichedProducts.reduce((acc, p) => acc + p.unitsSold, 0),
      },
      bestSellersByUnits,
      bestSellersByRevenue,
      lowStockProducts,
      outOfStockProducts,
      slowMovingProducts,
      collectionBreakdown,
      aiRecommendations,
    });
  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compute AI product analysis.' },
      { status: 500 }
    );
  }
}
