/**
 * =====================================================================
 * FEATURE FLAGS CONTROLLER - Quản lý Cờ tính năng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. KHI NÀO DÙNG?
 * - Khi cần quản lý bật/tắt các tính năng (features) trong hệ thống mà không cần deploy lại code.
 * - Ví dụ: Bật/tắt cổng thanh toán mới, banner khuyến mãi, hoặc module đang bảo trì.
 *
 * 2. CHỨC NĂNG CHÍNH:
 * - CRUD (Create, Read, Update, Delete) các Feature Flags.
 * - API này chỉ dành cho Admin (yêu cầu quyền `admin:read`, `admin:update`).
 *
 * 3. KIẾN TRÚC:
 * - Controller này nhận request HTTP -> Gọi xuống `FeatureFlagsService` để xử lý logic -> Trả về kết quả.
 * - Sử dụng các Decorators tùy chỉnh (`@RequirePermissions`, `@ApiListResponse`...) để chuẩn hóa code.
 *
 * =====================================================================
 */
import {
  RequirePermissions,
  ApiListResponse,
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
} from '@/common/decorators/crud.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/permissions.guard';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from './dto/feature-flag.dto';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('Admin - Feature Flags')
@ApiBearerAuth()
@Controller('admin/feature-flags')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @RequirePermissions('admin:read')
  @ApiListResponse('Feature Flag', { summary: 'Lấy danh sách feature flags' })
  async findAll() {
    const result = await this.featureFlagsService.findAll();
    return { data: result };
  }

  @Post()
  @RequirePermissions('admin:update')
  @ApiCreateResponse('Feature Flag', { summary: 'Tạo feature flag mới' })
  async create(@Body() dto: CreateFeatureFlagDto) {
    const result = await this.featureFlagsService.create(dto);
    return { data: result };
  }

  @Patch(':key')
  @RequirePermissions('admin:update')
  @ApiUpdateResponse('Feature Flag', { summary: 'Cập nhật feature flag' })
  async update(@Param('key') key: string, @Body() dto: UpdateFeatureFlagDto) {
    const result = await this.featureFlagsService.update(key, dto);
    return { data: result };
  }

  @Delete(':key')
  @RequirePermissions('admin:update')
  @ApiDeleteResponse('Feature Flag', { summary: 'Xóa feature flag' })
  async remove(@Param('key') key: string) {
    const result = await this.featureFlagsService.remove(key);
    return { data: result };
  }
}
