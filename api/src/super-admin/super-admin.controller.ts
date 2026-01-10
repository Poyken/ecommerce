import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
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
