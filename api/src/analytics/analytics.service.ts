import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

/**
 * =====================================================================
 * ANALYTICS SERVICE - Thống kê và Báo cáo
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATE FILTERS:
 * - Hỗ trợ lọc theo khoảng thời gian tùy chỉnh (Start Date -> End Date).
 * - Mặc định là 30 ngày gần nhất nếu không có tham số.
 *
 * 2. PERFORMANCE OPTIMIZATION:
 * - Sử dụng `Promise.all` để chạy song song các truy vấn độc lập.
 * - Sử dụng `aggregate`, `groupBy` của Prisma để tính toán trực tiếp trên database.
 *
 * 3. INVENTORY ANALYSIS:
 * - Phân tích tình trạng kho hàng: Hết hàng, sắp hết, tồn kho nhiều.
 * =====================================================================
 */

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(startDate?: string, endDate?: string) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Ensure start of day and end of day in UTC to match toISOString date parts
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    return { start, end };
  }

  async getStats(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    // Today's Date Range (UTC)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const [
      revenueResult,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      todayRevenueResult,
      todayOrders,
      lifetimeProducts,
      lifetimeCustomers,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: 'DELIVERED',
          createdAt: { gte: start, lte: end },
        },
      }),
      this.prisma.order.count({
        where: {
          status: 'DELIVERED',
          createdAt: { gte: start, lte: end },
        },
      }),
      this.prisma.user.count({
        where: {
          roles: { some: { role: { name: { in: ['CUSTOMER', 'USER'] } } } },
          createdAt: { gte: start, lte: end },
        },
      }),
      this.prisma.product.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.order.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: 'DELIVERED',
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.order.count({
        where: {
          status: 'DELIVERED',
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.product.count(), // Lifetime products
      this.prisma.user.count({
        where: {
          roles: { some: { role: { name: { in: ['CUSTOMER', 'USER'] } } } },
        },
      }), // Lifetime customers
    ]);

    // Get comparison data (previous period)
    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = new Date(start.getTime());

    const [prevRevenue] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: 'DELIVERED',
          createdAt: { gte: prevStart, lte: prevEnd },
        },
      }),
    ]);

    const currentRevenue = Number(revenueResult._sum.totalAmount || 0);
    const previousRevenue = Number(prevRevenue._sum.totalAmount || 0);
    const growth =
      previousRevenue === 0
        ? currentRevenue > 0
          ? 100
          : 0
        : ((currentRevenue - previousRevenue) / previousRevenue) * 100;

    return {
      totalRevenue: currentRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      growth: Math.round(growth * 10) / 10,
      pendingOrders,
      todayRevenue: Number(todayRevenueResult._sum.totalAmount || 0),
      todayOrders,
      lifetimeProducts,
      lifetimeCustomers,
    };
  }

  async getSalesData(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    // Optimized: Use raw SQL to group by date directly in database
    // This avoids fetching thousands of order objects into memory
    const salesData: any[] = await this.prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date, 
        SUM("totalAmount") as amount
      FROM "Order"
      WHERE "status" = 'DELIVERED'
      AND "createdAt" >= ${start} 
      AND "createdAt" <= ${end}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Map result to expected format (ensure date is string yyyy-mm-dd)
    return salesData.map((row) => ({
      date:
        typeof row.date === 'string'
          ? row.date
          : row.date.toISOString().split('T')[0],
      amount: Number(row.amount || 0),
    }));
  }

  async getTopProducts(limit = 5, startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    // Note: Prisma groupBy doesn't support relation filtering easily,
    // we filter order items via where clause on OrderItem
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['skuId'],
      _sum: { quantity: true },
      where: {
        order: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: start, lte: end },
        },
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    const skuIds = topItems.map((item) => item.skuId);
    const skus = await this.prisma.sku.findMany({
      where: {
        id: { in: skuIds },
      },
      include: {
        product: {
          select: { name: true, slug: true },
        },
        optionValues: {
          include: { optionValue: true },
        },
      },
    });

    const skuMap = new Map(skus.map((s) => [s.id, s]));

    const productsWithDetails = topItems.map((item) => {
      const sku = skuMap.get(item.skuId);
      const variants = sku?.optionValues
        .map((ov) => ov.optionValue.value)
        .join(', ');

      return {
        skuId: item.skuId,
        skuCode: sku?.skuCode || 'Unknown',
        productName: sku?.product?.name || 'Unknown',
        variants,
        quantity: item._sum.quantity || 0,
        revenue: Number(sku?.price || 0) * (item._sum.quantity || 0),
      };
    });

    return productsWithDetails;
  }

  async getInventoryAnalysis() {
    const skus = await this.prisma.sku.findMany({
      include: { product: { select: { name: true } } },
    });

    const lowStock = skus.filter((s) => s.stock < 10 && s.stock > 0);
    const outOfStock = skus.filter((s) => s.stock === 0);
    const healthyStock = skus.filter((s) => s.stock >= 10);

    return {
      totalSkus: skus.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      healthyStockCount: healthyStock.length,
      lowStockItems: lowStock
        .map((s) => ({
          skuCode: s.skuCode,
          name: s.product.name,
          stock: s.stock,
        }))
        .slice(0, 5),
    };
  }

  async getRevenueByCategory(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const categories = await this.prisma.category.findMany({
      include: {
        products: {
          include: {
            skus: {
              include: {
                orderItems: {
                  where: {
                    order: {
                      status: 'DELIVERED',
                      createdAt: { gte: start, lte: end },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return categories
      .map((category) => {
        let revenue = 0;
        category.products.forEach((product) => {
          product.skus.forEach((sku) => {
            sku.orderItems.forEach((item) => {
              revenue += Number(item.priceAtPurchase) * item.quantity;
            });
          });
        });

        return {
          name: category.name,
          revenue,
        };
      })
      .filter((c) => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }
}
