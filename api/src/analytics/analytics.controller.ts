import { Permissions } from '@/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
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
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Analyze inventory health' })
  async getInventoryAnalysis() {
    const data = await this.analyticsService.getInventoryAnalysis();
    return { data };
  }

  @Get('categories')
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
}
