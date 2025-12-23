import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    // console.log(
    //   `[Analytics] Range: ${start.toISOString()} - ${end.toISOString()}`,
    // );

    const [revenueResult, totalOrders, totalCustomers, totalProducts] =
      await Promise.all([
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
            roles: {
              some: {
                role: {
                  name: { in: ['CUSTOMER', 'USER'] },
                },
              },
            },
            createdAt: { gte: start, lte: end }, // Customers joined in period
          },
        }),
        this.prisma.product.count({
          where: { createdAt: { gte: start, lte: end } }, // New products
        }),
      ]);

    // console.log(
    //   `[Analytics] Stats: Orders=${totalOrders}, Revenue=${revenueResult._sum.totalAmount}`,
    // );

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
      totalCustomers, // New customers in period
      totalProducts, // New products in period
      growth: Math.round(growth * 10) / 10,
    };
  }

  async getSalesData(startDate?: string, endDate?: string) {
    const { start, end } = this.getDateRange(startDate, endDate);

    const orders = await this.prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: { gte: start, lte: end },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const dailySales: Record<string, number> = {};
    const dayCount = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Initialize all days with 0
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailySales[dateStr] = 0;
    }

    orders.forEach((order) => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (dailySales[dateStr] !== undefined) {
        dailySales[dateStr] += Number(order.totalAmount);
      }
    });

    return Object.entries(dailySales).map(([date, amount]) => ({
      date,
      amount,
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

    const productsWithDetails = await Promise.all(
      topItems.map(async (item) => {
        const sku = await this.prisma.sku.findUnique({
          where: { id: item.skuId },
          include: {
            product: {
              select: { name: true, slug: true },
            },
            optionValues: {
              include: { optionValue: true },
            },
          },
        });

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
      }),
    );

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
}
