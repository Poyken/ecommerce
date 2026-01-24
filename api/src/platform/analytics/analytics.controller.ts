import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { getTenant } from '@/core/tenant/tenant.context';

import { AppPermission } from '@/common/enums/permissions.enum';

/**
 * =====================================================================
 * ANALYTICS CONTROLLER - Hệ thống Báo cáo & Thống kê
 * =====================================================================
 *
 * =====================================================================
 */
@ApiTags('Admin Analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(AppPermission.ANALYTICS_READ)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Lấy tổng quan dashboard' })
  getDashboardOverview() {
    const tenant = getTenant();
    return this.analyticsService.getDashboardOverview(tenant!.id);
  }

  @Get('revenue-chart')
  @ApiOperation({ summary: 'Lấy biểu đồ doanh thu 30 ngày' })
  getRevenueChart() {
    const tenant = getTenant();
    return this.analyticsService.getRevenueChart(tenant!.id);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Lấy top 10 sản phẩm bán chạy' })
  getTopProducts() {
    const tenant = getTenant();
    return this.analyticsService.getTopProducts(tenant!.id);
  }

  @Get('orders-by-status')
  @ApiOperation({ summary: 'Thống kê đơn hàng theo trạng thái' })
  getOrdersByStatus() {
    const tenant = getTenant();
    return this.analyticsService.getOrdersByStatus(tenant!.id);
  }
}
