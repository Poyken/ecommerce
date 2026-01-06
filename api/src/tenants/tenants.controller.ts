import { Permissions } from '@/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';
import { getTenant } from '@core/tenant/tenant.context';

@ApiTags('Tenants (Super Admin)')
@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
@ApiBearerAuth()
/**
 * =================================================================================================
 * TENANTS CONTROLLER - QUẢN LÝ CỬA HÀNG (DÀNH CHO SUPER ADMIN)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PHÂN QUYỀN (RBAC):
 *    - Các API này rất nhạy cảm (Tạo/Xóa cửa hàng), nên được bảo vệ bởi `@Permissions`.
 *    - Chỉ User có Role là `SUPER_ADMIN` mới có thể gọi được quyền `tenant:create`, `tenant:delete`...
 *
 * 2. KIẾN TRÚC SAAS (SOFTWARE AS A SERVICE):
 *    - Đây là nơi quản lý "Khách hàng" của hệ thống Platform.
 *    - Một "Tenant" tương ứng với một "Cửa hàng" độc lập.
 *    - Controller này không xử lý logic bán hàng, mà chỉ xử lý việc Cấp phép (Provisioning) cửa hàng mới.
 * =================================================================================================
 */
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Permissions('tenant:create')
  @ApiOperation({ summary: 'Create a new Tenant (Store)' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @Permissions('tenant:read')
  @ApiOperation({ summary: 'List all Tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Permissions('tenant:read')
  @ApiOperation({ summary: 'Get Tenant info by ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('tenant:update')
  @ApiOperation({ summary: 'Update Tenant configuration' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @Permissions('tenant:delete')
  @ApiOperation({ summary: 'Delete a Tenant' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }

  // PUBLIC ENDPOINT
  @Get('current/config')
  @ApiBearerAuth() // Optional?
  @ApiOperation({ summary: 'Get current Tenant Configuration (Public)' })
  getTenantConfig() {
    // We need to dinamically import/use the context helper, or just move logic to service
    // But getTenant() is from ALS (AsyncLocalStorage)
    // We can use a custom decorator or just import the helper
    // We can use a custom decorator or just import the helper
    const tenant = getTenant();

    if (!tenant) {
      return {
        name: 'Platform Default',
        themeConfig: {
          primaryColor: '#000000',
          borderRadius: '0.5rem',
        },
      };
    }

    return {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      themeConfig: tenant.themeConfig,
      plan: tenant.plan,
    };
  }
}
