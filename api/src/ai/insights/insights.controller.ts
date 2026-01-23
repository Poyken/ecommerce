/**
 * =====================================================================
 * AI INSIGHTS CONTROLLER - ĐIỀU HƯỚNG BÁO CÁO THÔNG MINH
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DASHBOARD DATA (Dữ liệu bảng điều khiển):
 * - Controller này cung cấp "linh hồn" cho trang Dashboard của Admin.
 * - Thay vì trả về hàng ngàn dòng log, nó trả về các Insight đã được cô đọng.
 *
 * 2. FORCE REFRESH (Làm mới thủ công):
 * - Endpoint `@Post('refresh')` cho phép Admin chủ động tính toán lại dữ liệu
 *   ngay lập tức (VD: sau khi vừa chốt một đợt Flash Sale lớn) thay vì đợi Cache hết hạn.
 *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Giúp Admin đưa ra quyết định kinh doanh dựa trên dữ liệu thực tế (Data-driven decisions) một cách nhanh chóng.
 * =====================================================================
 */

import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
// import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard'; // Assuming global guard or handled by layout
// import { RolesGuard } from '@/identity/auth/roles.guard';
// import { Roles } from '@/identity/auth/roles.decorator';
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
