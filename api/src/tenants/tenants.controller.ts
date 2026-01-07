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
  Request,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';
import { getTenant } from '@core/tenant/tenant.context';

@ApiTags('Tenants (Super Admin)')
@Controller('tenants')
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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Tenant (Store)' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all Tenants' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin store của tôi (Tenant Admin)' })
  async getMyTenant(@Request() req: any) {
    const tenantId = req.user.tenantId;
    if (!tenantId)
      throw new NotFoundException(
        'Your user is not associated with any tenant',
      );
    return this.tenantsService.findOne(tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Tenant info by ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Tenant configuration' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('tenant:delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a Tenant' })
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }

  // PUBLIC ENDPOINT - No Guards
  @Get('current/config')
  @ApiOperation({ summary: 'Get current Tenant Configuration (Public)' })
  getTenantConfig() {
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
