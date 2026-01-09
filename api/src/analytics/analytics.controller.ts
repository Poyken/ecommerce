import {
  ApiGetOneResponse,
  ApiListResponse,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CreateVitalDto } from './dto/create-vital.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('analytics:read')
  @ApiGetOneResponse('Analytics Stats', {
    summary: 'Get overall store statistics',
  })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.analyticsService.getStats(startDate, endDate);
    return { data };
  }

  @Get('sales')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('analytics:read')
  @ApiListResponse('Sales Data', { summary: 'Get sales data over time' })
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
  @RequirePermissions('analytics:read')
  @ApiListResponse('Top Products', { summary: 'Get top selling products' })
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
  @RequirePermissions('analytics:read')
  @ApiGetOneResponse('Inventory Analysis', {
    summary: 'Analyze inventory health',
  })
  async getInventoryAnalysis() {
    const data = await this.analyticsService.getInventoryAnalysis();
    return { data };
  }

  @Get('categories')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('analytics:read')
  @ApiListResponse('Revenue by Category', {
    summary: 'Get revenue by category',
  })
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
  async postVitals(@Body() data: CreateVitalDto) {
    const result = await this.analyticsService.savePerformanceMetric({
      name: data.name,
      value: data.value,
      rating: data.rating,
      url: data.url || '',
      userAgent: data.userAgent,
      navigationType: data.navigationType,
    });
    return { data: result };
  }
}
