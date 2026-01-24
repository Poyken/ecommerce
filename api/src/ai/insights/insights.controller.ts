/**
 * =====================================================================
 * AI INSIGHTS CONTROLLER - ĐIỀU HƯỚNG BÁO CÁO THÔNG MINH
 * =====================================================================
 *
 * =====================================================================
 */

import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
// import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard'; // Assuming global guard or handled by layout
// import { RolesGuard } from '@/identity/auth/roles.guard';
// import { Roles } from '@/identity/auth/roles.decorator';
// import { Role } from '@prisma/client';

import { RequireTenant } from '@core/tenant/tenant.decorator';

@ApiTags('Insights')
@Controller('insights')
@RequireTenant()
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  @ApiOperation({ summary: 'Get daily business insights' })
  async getInsights() {
    const data = await this.insightsService.getDailyInsights();
    return { success: true, data };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Force refresh AI insights' })
  async refreshInsights() {
    const data = await this.insightsService.refreshInsights();
    return { success: true, data };
  }
}
