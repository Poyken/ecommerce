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
  ) {
    const result = await this.auditService.findAll(+page, +limit, search);
    return result; // Result already has { data, meta }
  }
}
