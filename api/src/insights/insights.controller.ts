/**
 * =====================================================================
 * INSIGHTS.CONTROLLER CONTROLLER
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Controller này xử lý các HTTP request từ client.
 *
 * 1. NHIỆM VỤ CHÍNH:
 *    - Nhận request từ client
 *    - Validate dữ liệu đầu vào
 *    - Gọi service xử lý logic
 *    - Trả về response cho client
 *
 * 2. CÁC ENDPOINT:
 *    - [Liệt kê các endpoint]
 * =====================================================================
 */

import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
// import { JwtAuthGuard } from '@/auth/jwt-auth.guard'; // Assuming global guard or handled by layout
// import { RolesGuard } from '@/auth/roles.guard';
// import { Roles } from '@/auth/roles.decorator';
// import { Role } from '@prisma/client';

@ApiTags('Insights')
@Controller('insights')
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
