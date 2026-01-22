import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { getTenant } from '@core/tenant/tenant.context';
import { PrismaService } from '@core/prisma/prisma.service';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';

@ApiTags('Tenant Settings (Admin)')
@Controller('tenant-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TenantSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions('tenant:read')
  @ApiOperation({ summary: 'Lấy cấu hình cửa hàng hiện tại' })
  async getSettings() {
    const tenant = getTenant();
    if (!tenant) throw new Error('Tenant context missing');

    let settings = await (this.prisma as any).tenantSettings.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!settings) {
      // Lazy creation with defaults
      settings = await (this.prisma as any).tenantSettings.create({
        data: { tenantId: tenant.id },
      });
    }

    return { data: settings };
  }

  @Patch()
  @RequirePermissions('tenant:update')
  @ApiOperation({ summary: 'Cập nhật cấu hình cửa hàng' })
  async updateSettings(@Body() dto: UpdateTenantSettingsDto) {
    const tenant = getTenant();
    if (!tenant) throw new Error('Tenant context missing');

    // Ensure exists
    await this.getSettings();

    const settings = await (this.prisma as any).tenantSettings.update({
      where: { tenantId: tenant.id },
      data: dto,
    });

    return { data: settings };
  }
}
