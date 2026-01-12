/**
 * =====================================================================
 * AUDIT CONTROLLER - Nhật ký hoạt động hệ thống
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. AUDIT LOGGING:
 * - Ghi lại MỌI hành động quan trọng (Ai làm gì? Khi nào? Ở đâu? Giá trị cũ/mới là gì?).
 * - Controller này giúp Admin tra cứu lại lịch sử để truy vết lỗi hoặc hành vi gian lận.
 *
 * 2. PERMISSIONS:
 * - Chỉ user có quyền `auditLog:read` mới được xem.
 * =====================================================================
 */
import {
  RequirePermissions,
  ApiListResponse,
} from '@/common/decorators/crud.decorators';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin - Audit Logs')
@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('auditLog:read')
  @ApiListResponse('Audit Log', { summary: 'Truy xuất nhật ký hệ thống' })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('roles') roles?: string,
    @Query('filter') filter?: string,
  ) {
    const rolesArray = roles ? roles.split(',') : undefined;
    const result = await this.auditService.findAll(
      +page,
      +limit,
      search,
      rolesArray,
      filter,
    );
    return result; // Result already has { data, meta }
  }
}
