import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
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
  getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getStats(startDate, endDate);
  }

  @Get('sales')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Get sales data over time' })
  getSalesData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('days') days?: string,
  ) {
    if (days && !startDate) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(days));
      startDate = date.toISOString();
    }
    return this.analyticsService.getSalesData(startDate, endDate);
  }

  @Get('top-products')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Get top selling products' })
  getTopProducts(
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getTopProducts(
      limit ? parseInt(limit) : 5,
      startDate,
      endDate,
    );
  }

  @Get('inventory')
  @Permissions('analytics:read')
  @ApiOperation({ summary: 'Analyze inventory health' })
  getInventoryAnalysis() {
    return this.analyticsService.getInventoryAnalysis();
  }
}
