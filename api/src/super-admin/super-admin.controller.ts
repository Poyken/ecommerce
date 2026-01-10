import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { Permissions } from '@/auth/decorators/permissions.decorator';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('SUPER_ADMIN')
export class SuperAdminController {
  constructor(private readonly service: SuperAdminService) {}

  @Get('stats')
  getStats() {
    return this.service.getGlobalStats();
  }

  @Post('tenants/:id/impersonate')
  impersonate(@Param('id') id: string) {
    return this.service.impersonate(id);
  }
}
