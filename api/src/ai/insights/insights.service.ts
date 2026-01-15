/**
 * =====================================================================
 * OUTBOX-CLEANUP PROCESSOR - DỌN DẸP DỮ LIỆU TỰ ĐỘNG (BULLMQ)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 *      dùng Redis (CACHE_MANAGER).
 *
 * 3. LƯU Ý KHI SỬ DỤNG:
 *    - Khi có thay đổi lớn (VD: Đơn hàng mới, Nhập hàng), có thể gọi refreshInsights(). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CacheService } from '@core/cache/cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';

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
  private readonly CACHE_KEY = 'daily_insights';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getDailyInsights(): Promise<DailyInsights | null> {
    const cached = await this.cacheManager.get<DailyInsights>(this.CACHE_KEY);
    if (!cached) {
      return this.generateInsights();
    }
    return cached;
  }

  async refreshInsights(): Promise<DailyInsights> {
    return this.generateInsights();
  }

  private async generateInsights(): Promise<DailyInsights> {
    this.logger.log('Generating AI Insights...');
    const insights: Insight[] = [];

    // 1. Check Sales Trend (Today vs Yesterday) - Mock simple logic
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // In real app, query Orders table.
    // Mocking for robustness without dependent services
    const salesGrowth = 15; // Mock
    if (salesGrowth > 0) {
      insights.push({
        type: 'success',
        title: 'Doanh thu tăng trưởng',
        message: `Doanh thu hôm nay tăng ${salesGrowth}% so với hôm qua.`,
        action: 'Xem báo cáo',
      });
    }

    // 2. Check Inventory (Low Stock)
    const lowStockCount = await this.prisma.sku.count({
      where: { stock: { lt: 5 }, status: 'ACTIVE' },
    });

    if (lowStockCount > 0) {
      insights.push({
        type: 'warning',
        title: 'Cảnh báo tồn kho',
        message: `Có ${lowStockCount} sản phẩm sắp hết hàng.`,
        action: 'Nhập hàng ngay',
      });
    } else {
      insights.push({
        type: 'info',
        title: 'Tồn kho ổn định',
        message: 'Tất cả sản phẩm đều đủ hàng.',
      });
    }

    // 3. New Customers
    // Mock
    insights.push({
      type: 'info',
      title: 'Khách hàng mới',
      message: 'Có 5 khách hàng mới đăng ký hôm nay.',
    });

    const result: DailyInsights = {
      insights,
      summary:
        'Tình hình kinh doanh hôm nay khả quan. Cần chú ý nhập hàng kịp thời.',
      generatedAt: new Date().toISOString(),
    };

    // Cache for 4 hours
    await this.cacheManager.set(this.CACHE_KEY, result, 4 * 60 * 60 * 1000);

    return result;
  }
}
