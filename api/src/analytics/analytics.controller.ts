import { Permissions } from '@/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

/**
 * =====================================================================
 * ANALYTICS CONTROLLER - TRUNG TÂM PHÂN TÍCH DỮ LIỆU
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STORE STATISTICS:
 * - Cung cấp dữ liệu tổng quan cho Dashboard của Admin: Doanh thu, số đơn hàng, top sản phẩm bán chạy.
 * - Dữ liệu này thường rất nặng nên cần được tối ưu bằng Aggregate hoặc Materialized Views (Trong tương lai).
 *
 * 2. WEB VITALS (Đo lường hiệu năng):
 * - API `/vitals` nhận dữ liệu từ Frontend về tốc độ Load trang của người dùng thực tế.
 * - Giúp team kỹ thuật biết được web có đang bị chậm ở đâu không để kịp thời tối ưu.
 * =====================================================================
 */
@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Get overall store statistics' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.analyticsService.getStats(startDate, endDate);
    return { data };
  }

  @Get('sales')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Get sales data over time' })
  async getSalesData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('days') days?: string,
  ) {
    if (days && !startDate) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(days));
      startDate = date.toISOString();
    }
    const data = await this.analyticsService.getSalesData(startDate, endDate);
    return { data };
  }

  @Get('top-products')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Get top selling products' })
  async getTopProducts(
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.analyticsService.getTopProducts(
      limit ? parseInt(limit) : 5,
      startDate,
      endDate,
    );
    return { data };
  }

  @Get('inventory')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Analyze inventory health' })
  async getInventoryAnalysis() {
    const data = await this.analyticsService.getInventoryAnalysis();
    return { data };
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Get revenue by category' })
  async getRevenueByCategory(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.analyticsService.getRevenueByCategory(
      startDate,
      endDate,
    );
    return { data };
  }

  @Post('vitals')
  @ApiOperation({ summary: 'Receive Web Vitals telemetry' })
  async postVitals(
    @Body()
    data: {
      name: string;
      value: number;
      rating: string;
      url: string;
      userAgent?: string;
      navigationType?: string;
    },
  ) {
    return this.analyticsService.savePerformanceMetric(data);
  }
}
