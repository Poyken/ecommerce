import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../auth/optional-jwt-auth.guard';
import { FeatureFlagsService } from './feature-flags.service';

/**
 * =====================================================================
 * FEATURE FLAGS PUBLIC CONTROLLER - LẤY TÍNH NĂNG CHO FRONTEND
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONTEXT-BASED FLAGS (Flag theo ngữ cảnh):
 * - Frontend gọi API này để biết mình được phép hiển thị những tính năng nào.
 * - Kết quả trả về phụ thuộc vào: User đã login chưa? (userId), Môi trường đang chạy là gì? (development/production).
 *
 * 2. OPTIONAL AUTH:
 * - API này dùng `OptionalJwtAuthGuard`. Nghĩa là khách vãng lai (không login) vẫn gọi được, nhưng họ sẽ chỉ thấy các flag chung chung, không thấy các flag dành riêng cho thành viên VIP.
 * =====================================================================
 */

@ApiTags('FeatureFlags')
@Controller('feature-flags')
export class FeatureFlagsPublicController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getMyFlags(@Req() req: any) {
    const userId = req.user?.id;
    const environment = process.env.NODE_ENV || 'development';

    return this.featureFlagsService.getEnabledFlagsForContext({
      userId,
      environment,
    });
  }
}
