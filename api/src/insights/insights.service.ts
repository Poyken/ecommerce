import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GeminiService } from '@/ai-chat/gemini.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { RedisService } from '@core/redis/redis.service';

/**
 * =============================================================================
 * INSIGHTS SERVICE - AI BUSINESS ADVISOR
 * =============================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Service này hoạt động như một "Cố vấn kinh doanh ảo":
 * 1. Thu thập dữ liệu kinh doanh hàng ngày
 * 2. Gửi cho AI phân tích
 * 3. Lưu kết quả vào Redis để hiển thị trên Dashboard
 *
 * Cronjob chạy mỗi ngày lúc 6:00 sáng
 *
 * =============================================================================
 */

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
  private readonly INSIGHTS_KEY_PREFIX = 'insights:tenant:';
  private readonly INSIGHTS_TTL = 24 * 60 * 60; // 24 hours

  constructor(
    private readonly geminiService: GeminiService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Cronjob: Chạy hàng ngày lúc 6:00 sáng
   * Tạo insights cho tất cả tenants
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async generateDailyInsights() {
    this.logger.log('🚀 Starting daily insights generation...');

    try {
      // Get all active tenants (no deletedAt field in Tenant model, check isActive if available)
      const tenants = await this.prisma.tenant.findMany({
        select: { id: true, name: true },
      });

      for (const tenant of tenants) {
        try {
          await this.generateInsightsForTenant(tenant.id);
          this.logger.log(`✅ Generated insights for tenant: ${tenant.name}`);
        } catch (error) {
          this.logger.error(
            `❌ Failed to generate insights for tenant: ${tenant.name}`,
            error,
          );
        }
      }

      this.logger.log(
        `📊 Daily insights generated for ${tenants.length} tenants`,
      );
    } catch (error) {
      this.logger.error('Failed to run daily insights job', error);
    }
  }

  /**
   * Tạo insights cho một tenant cụ thể
   */
  async generateInsightsForTenant(tenantId: string): Promise<DailyInsights> {
    // 1. Collect business data
    const businessData = await this.collectBusinessData(tenantId);

    // 2. Send to AI for analysis
    const aiResponse =
      await this.geminiService.generateBusinessInsights(businessData);

    // 3. Save to Redis
    const insights: DailyInsights = {
      insights: aiResponse.insights,
      summary: aiResponse.summary,
      generatedAt: new Date().toISOString(),
    };

    await this.redis.client.set(
      `${this.INSIGHTS_KEY_PREFIX}${tenantId}`,
      JSON.stringify(insights),
      'EX',
      this.INSIGHTS_TTL,
    );

    return insights;
  }

  /**
   * Lấy insights đã lưu cho tenant
   */
  async getInsightsForTenant(tenantId: string): Promise<DailyInsights | null> {
    const cached = await this.redis.client.get(
      `${this.INSIGHTS_KEY_PREFIX}${tenantId}`,
    );

    if (cached) {
      return JSON.parse(cached);
    }

    // If no cache, generate new insights
    return this.generateInsightsForTenant(tenantId);
  }

  /**
   * Thu thập dữ liệu kinh doanh cho tenant
   */
  private async collectBusinessData(tenantId: string) {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(
      weekStart.getTime() - 7 * 24 * 60 * 60 * 1000,
    );

    // Today's revenue
    const todayOrders = await this.prisma.order.aggregate({
      where: {
        tenantId,
        createdAt: { gte: todayStart },
        paymentStatus: 'PAID',
      },
      _sum: { totalAmount: true },
    });

    // Yesterday's revenue
    const yesterdayOrders = await this.prisma.order.aggregate({
      where: {
        tenantId,
        createdAt: { gte: yesterdayStart, lt: todayStart },
        paymentStatus: 'PAID',
      },
      _sum: { totalAmount: true },
    });

    // This week's revenue
    const weekOrders = await this.prisma.order.aggregate({
      where: {
        tenantId,
        createdAt: { gte: weekStart },
        paymentStatus: 'PAID',
      },
      _sum: { totalAmount: true },
    });

    // Last week's revenue
    const lastWeekOrders = await this.prisma.order.aggregate({
      where: {
        tenantId,
        createdAt: { gte: lastWeekStart, lt: weekStart },
        paymentStatus: 'PAID',
      },
      _sum: { totalAmount: true },
    });

    // Top viewed products (mock for now - in production, use analytics data)
    const topProducts = await this.prisma.product.findMany({
      where: { tenantId, deletedAt: null },
      take: 5,
      orderBy: { reviewCount: 'desc' },
      include: {
        skus: { where: { status: 'ACTIVE' }, select: { stock: true }, take: 1 },
      },
    });

    // Low stock products
    const lowStockSkus = await this.prisma.sku.findMany({
      where: {
        product: { tenantId },
        stock: { lte: 10 },
        status: 'ACTIVE',
      },
      take: 5,
      include: { product: { select: { name: true } } },
    });

    // Pending orders
    const pendingOrders = await this.prisma.order.count({
      where: { tenantId, status: 'PENDING' },
    });

    // Customer stats
    const totalCustomers = await this.prisma.user.count({
      where: {
        orders: { some: { tenantId } },
      },
    });

    const newCustomersToday = await this.prisma.user.count({
      where: {
        createdAt: { gte: todayStart },
        orders: { some: { tenantId } },
      },
    });

    return {
      todayRevenue: Number(todayOrders._sum.totalAmount) || 0,
      yesterdayRevenue: Number(yesterdayOrders._sum.totalAmount) || 0,
      weekRevenue: Number(weekOrders._sum.totalAmount) || 0,
      lastWeekRevenue: Number(lastWeekOrders._sum.totalAmount) || 0,
      topViewedProducts: topProducts.map((p) => ({
        name: p.name,
        views: p.reviewCount * 10, // Mock views based on reviews
        stock: p.skus[0]?.stock || 0,
      })),
      lowStockProducts: lowStockSkus.map((s) => ({
        name: s.product.name,
        stock: s.stock,
      })),
      pendingOrders,
      totalCustomers,
      newCustomersToday,
    };
  }
}
