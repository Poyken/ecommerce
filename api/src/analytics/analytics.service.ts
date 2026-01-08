import { CacheService } from '@core/cache/cache.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

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
  private readonly logger = new Logger(AnalyticsService.name);
  private metricsBuffer: any[] = [];
  private readonly FLUSH_THRESHOLD = 50;
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

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
    const cacheKey = `analytics:stats:${startDate || 'default'}:${endDate || 'default'}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
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
              status: { notIn: ['CANCELLED', 'RETURNED'] },
              createdAt: { gte: start, lte: end },
            },
          }),
          this.prisma.order.count({
            where: {
              status: { notIn: ['CANCELLED', 'RETURNED'] },
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
              status: { notIn: ['CANCELLED', 'RETURNED'] },
              createdAt: { gte: todayStart, lte: todayEnd },
            },
          }),
          this.prisma.order.count({
            where: {
              status: { notIn: ['CANCELLED', 'RETURNED'] },
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
              status: { notIn: ['CANCELLED', 'RETURNED'] },
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
      },
      1800, // 30 minutes cache for stats
    );
  }

  async getSalesData(startDate?: string, endDate?: string) {
    const cacheKey = `analytics:sales:${startDate || 'default'}:${endDate || 'default'}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const { start, end } = this.getDateRange(startDate, endDate);

        // Optimized: Use raw SQL to group by date directly in database
        // This avoids fetching thousands of order objects into memory
        const salesData: any[] = await this.prisma.$queryRaw`
          SELECT 
            DATE("createdAt") as date, 
            SUM("totalAmount") as amount
          FROM "Order"
          WHERE "status" NOT IN ('CANCELLED', 'RETURNED')
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
      },
      3600, // 1 hour cache for historical sales
    );
  }

  /**
   * [P16 OPTIMIZATION] Historical Stats Pre-computation
   * Warms the cache daily to ensure instant load of Admin Dashboard comparison data.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async precomputeHistoricalStats() {
    this.logger.log('[Analytics] Pre-computing historical stats...');
    // Warm default 30-day range
    await this.getStats();
    this.logger.log('[Analytics] Historical stats pre-computation complete.');
  }

  async getTopProducts(limit = 5, startDate?: string, endDate?: string) {
    const cacheKey = `analytics:top-products:${limit}:${startDate || 'default'}:${endDate || 'default'}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const { start, end } = this.getDateRange(startDate, endDate);

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
          select: {
            id: true,
            skuCode: true,
            price: true,
            product: {
              select: { name: true, slug: true },
            },
            optionValues: {
              select: {
                optionValue: {
                  select: { value: true },
                },
              },
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
      },
      3600,
    );
  }

  async getInventoryAnalysis() {
    const cacheKey = `analytics:inventory`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // [P8 OPTIMIZATION] Use separate COUNT queries for much better scalability
        // This avoids OOM when catalog has millions of SKUs
        const [
          totalSkus,
          lowStockCount,
          outOfStockCount,
          healthyStockCount,
          lowStockItems,
        ] = await Promise.all([
          this.prisma.sku.count(),
          this.prisma.sku.count({ where: { stock: { lt: 10, gt: 0 } } }),
          this.prisma.sku.count({ where: { stock: 0 } }),
          this.prisma.sku.count({ where: { stock: { gte: 10 } } }),
          this.prisma.sku.findMany({
            where: { stock: { lt: 10, gt: 0 } },
            take: 5,
            include: { product: { select: { name: true } } },
          }),
        ]);

        return {
          totalSkus,
          lowStockCount,
          outOfStockCount,
          healthyStockCount,
          lowStockItems: lowStockItems.map((s) => ({
            skuCode: s.skuCode,
            name: s.product.name,
            stock: s.stock,
          })),
        };
      },
      600, // 10 minutes cache for inventory
    );
  }

  async getRevenueByCategory(startDate?: string, endDate?: string) {
    const cacheKey = `analytics:revenue-by-category:${startDate || 'default'}:${endDate || 'default'}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const { start, end } = this.getDateRange(startDate, endDate);

        // [P1 OPTIMIZATION] Use Raw SQL to calculate total revenue per category directly
        // This is significantly faster than fetching all records and iterating in memory
        const result: any[] = await this.prisma.$queryRaw`
          SELECT 
            c."name" as name,
            SUM(CAST(oi."priceAtPurchase" AS DECIMAL) * oi."quantity") as revenue
          FROM "Category" c
          JOIN "ProductToCategory" ptc ON ptc."categoryId" = c."id"
          JOIN "Product" p ON p."id" = ptc."productId"
          JOIN "Sku" s ON s."productId" = p."id"
          JOIN "OrderItem" oi ON oi."skuId" = s."id"
          JOIN "Order" o ON o."id" = oi."orderId"
          WHERE o."status" NOT IN ('CANCELLED', 'RETURNED')
          AND o."createdAt" >= ${start}
          AND o."createdAt" <= ${end}
          GROUP BY c."id", c."name"
          ORDER BY revenue DESC
        `;

        return result.map((r) => ({
          name: r.name,
          revenue: Number(r.revenue || 0),
        }));
      },
      3600,
    );
  }

  /**
   * [P16 OPTIMIZATION] Metric Write Buffering
   * Buffers performance metrics and flushes them in batches to reduce DB IOPS.
   */
  async savePerformanceMetric(data: {
    name: string;
    value: number;
    rating: string;
    url: string;
    userAgent?: string;
    navigationType?: string;
  }) {
    this.metricsBuffer.push({
      ...data,
      createdAt: new Date(),
    });

    if (this.metricsBuffer.length >= this.FLUSH_THRESHOLD) {
      await this.flushMetrics();
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async flushMetrics() {
    /**
     * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
     * - Tại sao không lưu ngay vào DB mỗi khi có request? -> Để tránh quá tải IOPS (Input/Output Operations per Second).
     * - Lưu vào buffer (RAM) và định kỳ 1 phút (hoặc khi đầy) mới flush một lần bằng `createMany`.
     * - Đây là kỹ thuật Write-Behind Caching giúp hệ thống chịu tải cực tốt.
     */
    if (this.metricsBuffer.length === 0) return;

    const batch = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      await (this.prisma as any).performanceMetric.createMany({
        data: batch,
        skipDuplicates: true,
      });
      this.logger.debug(
        `[Metrics] Flushed ${batch.length} performance metrics to DB`,
      );
    } catch (error) {
      this.logger.error('Failed to flush performance metrics:', error);
      // Re-add to buffer if failed (to avoid data loss)
      this.metricsBuffer = [...batch, ...this.metricsBuffer];
    }
  }
}
