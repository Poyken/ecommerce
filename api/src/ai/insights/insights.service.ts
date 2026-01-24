import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { GeminiService } from '../ai-chat/gemini.service';
import { getTenant } from '@core/tenant/tenant.context';

export interface Insight {
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  action?: string;
}

export interface DailyInsights {
  insights: Insight[];
  summary: string;
  generatedAt: string;
}

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);
  private readonly CACHE_KEY_PREFIX = 'daily_insights:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private getTenantId(): string {
    const tenant = getTenant();
    if (!tenant?.id) {
      // For demo/development purpose, we might fallback to a default if not in context
      // but in production tenant context is mandatory for insights
      return 'default';
    }
    return tenant.id;
  }

  async getDailyInsights(): Promise<DailyInsights | null> {
    const tenantId = this.getTenantId();
    const cacheKey = `${this.CACHE_KEY_PREFIX}${tenantId}`;

    const cached = await this.cacheManager.get<DailyInsights>(cacheKey);
    if (!cached) {
      return this.generateInsights(tenantId);
    }
    return cached;
  }

  async refreshInsights(): Promise<DailyInsights> {
    const tenantId = this.getTenantId();
    return this.generateInsights(tenantId);
  }

  private async generateInsights(tenantId: string): Promise<DailyInsights> {
    this.logger.log(`Generating AI Insights for tenant: ${tenantId}...`);

    try {
      // 1. Gather Data
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      const lastWeek = new Date(startOfWeek);
      lastWeek.setDate(startOfWeek.getDate() - 7);

      // Aggregations
      const [
        todayData,
        yesterdayData,
        weekData,
        lastWeekData,
        lowStockProducts,
        topViewedProducts, // Using top rated as proxy
        pendingOrders,
        customers,
      ] = await Promise.all([
        // Today Revenue
        this.prisma.order.aggregate({
          where: {
            tenantId,
            createdAt: { gte: today },
            status: { not: 'CANCELLED' },
          },
          _sum: { totalAmount: true },
        }),
        // Yesterday Revenue
        this.prisma.order.aggregate({
          where: {
            tenantId,
            createdAt: { gte: yesterday, lt: today },
            status: { not: 'CANCELLED' },
          },
          _sum: { totalAmount: true },
        }),
        // Weekly Revenue
        this.prisma.order.aggregate({
          where: {
            tenantId,
            createdAt: { gte: startOfWeek },
            status: { not: 'CANCELLED' },
          },
          _sum: { totalAmount: true },
        }),
        // Last Week Revenue
        this.prisma.order.aggregate({
          where: {
            tenantId,
            createdAt: { gte: lastWeek, lt: startOfWeek },
            status: { not: 'CANCELLED' },
          },
          _sum: { totalAmount: true },
        }),
        // Low Stock (using Sku)
        this.prisma.sku.findMany({
          where: { tenantId, status: 'ACTIVE', stock: { lt: 10 } },
          select: { skuCode: true, stock: true },
          take: 5,
        }),
        // Top Rated Products (proxy for top viewed)
        this.prisma.product.findMany({
          where: { tenantId, deletedAt: null },
          orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
          select: { name: true, avgRating: true, reviewCount: true },
          take: 5,
        }),
        // Pending Orders
        this.prisma.order.count({
          where: { tenantId, status: 'PENDING' },
        }),
        // Customers
        this.prisma.user.count({
          where: { tenantId },
        }),
      ]);

      const businessData = {
        todayRevenue: Number(todayData._sum.totalAmount || 0),
        yesterdayRevenue: Number(yesterdayData._sum.totalAmount || 0),
        weekRevenue: Number(weekData._sum.totalAmount || 0),
        lastWeekRevenue: Number(lastWeekData._sum.totalAmount || 0),
        lowStockProducts: lowStockProducts.map((s) => ({
          name: s.skuCode,
          stock: s.stock,
        })),
        topViewedProducts: topViewedProducts.map((p) => ({
          name: p.name,
          views: p.reviewCount, // proxy
          stock: 100, // placeholder since not easily fetched in same query
        })),
        pendingOrders,
        totalCustomers: customers,
        newCustomersToday: 0, // Simplified
      };

      // 2. Call Gemini
      const aiResult =
        await this.geminiService.generateBusinessInsights(businessData);

      const result: DailyInsights = {
        insights: aiResult.insights.map((i) => ({
          type: i.type as any,
          title: i.title,
          message: i.message,
          action: i.action,
        })),
        summary: aiResult.summary,
        generatedAt: new Date().toISOString(),
      };

      // 3. Cache for 4 hours
      const cacheKey = `${this.CACHE_KEY_PREFIX}${tenantId}`;
      await this.cacheManager.set(cacheKey, result, 4 * 60 * 60 * 1000);

      return result;
    } catch (error) {
      this.logger.error('Failed to generate insights', error);
      // Fallback
      return {
        insights: [
          {
            type: 'info',
            title: 'Đang cập nhật',
            message: 'Hệ thống đang tổng hợp dữ liệu, vui lòng quay lại sau.',
          },
        ],
        summary: 'Dữ liệu Insights đang được chuẩn bị.',
        generatedAt: new Date().toISOString(),
      };
    }
  }
}
