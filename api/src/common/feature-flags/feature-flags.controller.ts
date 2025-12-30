import { Permissions } from '@/auth/decorators/permissions.decorator';
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

/**
 * =====================================================================
 * FEATURE FLAGS CONTROLLER - ĐIỀU KHIỂN TÍNH NĂNG ĐỘNG (ADMIN)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC TOGGLE (Bật/Tắt động):
 * - Cho phép Admin bật hoặc tắt một tính năng mới (VD: `dark_mode`, `new_checkout`) ngay lập tức mà không cần deploy lại code.
 *
 * 2. SAFE ROLLOUT (Triển khai an toàn):
 * - Giảm thiểu rủi ro khi ra mắt tính năng lớn. Nếu có lỗi, Admin chỉ cần vào đây Tắt đi là xong.
 * =====================================================================
 */
@ApiTags('Admin - Feature Flags')
@ApiBearerAuth()
@Controller('admin/feature-flags')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('admin:write')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @Permissions('admin:read')
  findAll() {
    return this.featureFlagsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateFeatureFlagDto) {
    return this.featureFlagsService.create(dto);
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.featureFlagsService.update(key, dto);
  }

  @Delete(':key')
  remove(@Param('key') key: string) {
    return this.featureFlagsService.remove(key);
  }
}
