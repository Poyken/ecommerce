import type { RequestWithUser } from '@/identity/auth/interfaces/request-with-user.interface';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '@/identity/auth/optional-jwt-auth.guard';
import { FeatureFlagsService } from './feature-flags.service';

/**
 * =====================================================================
 * FEATURE FLAGS PUBLIC CONTROLLER - Cờ tính năng (Public)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FEATURE FLAGS LÀ GÌ?
 * - Là kỹ thuật bật/tắt tính năng mà không cần deploy lại code.
 * - Ví dụ: Ta đang phát triển tính năng "Chat AI" nhưng chưa muốn public cho toàn bộ user,
 *   ta tạo cờ `chat_ai` và chỉ bật cho Admin hoặc 10% users.
 *
 * 2. TẠI SAO CẦN CONTROLLER NÀY?
 * - Frontend cần biết tính năng nào đang bật để hiển thị UI tương ứng.
 * - Endpoint `my-flags` sẽ trả về danh sách cờ dựa trên "Context" của user hiện tại
 *   (UserID, Environment, v.v...).
 *
 * 3. OPTIONAL AUTH GUARD:
 * - Dùng `OptionalJwtAuthGuard` vì user có thể chưa login (Guest).
 * - Nếu Guest -> userId = undefined -> Vẫn trả về các cờ mặc định cho Guest. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, validate dữ liệu và điều phối xử lý logic thông qua các Service tương ứng.

 * =====================================================================
 */
@ApiTags('FeatureFlags')
@Controller('feature-flags')
export class FeatureFlagsPublicController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get('my-flags')
  @UseGuards(OptionalJwtAuthGuard)
  async getMyFlags(@Req() req: RequestWithUser) {
    const userId = req.user?.id;
    const environment = process.env.NODE_ENV || 'development';

    return this.featureFlagsService.getEnabledFlagsForContext({
      userId,
      environment,
    });
  }
}
