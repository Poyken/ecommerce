/**
 * =====================================================================
 * AUDIT CONTROLLER - Nhật ký hoạt động hệ thống
 * =====================================================================
 *
 * =====================================================================
 */
import {
  RequirePermissions,
  ApiListResponse,
} from '@/common/decorators/crud.decorators';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
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

    // Standardized role name is SUPERADMIN
    // No special normalization needed as all roles are unified to SUPERADMIN in the DB and code.

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
