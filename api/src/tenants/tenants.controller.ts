import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';
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
 *    - Chỉ User có Role là `SUPERADMIN` mới có thể gọi được quyền `tenant:create`, `tenant:delete`...
 *
 * 2. KIẾN TRÚC SAAS (SOFTWARE AS A SERVICE):
 *    - Đây là nơi quản lý "Khách hàng" của hệ thống Platform.
 *    - Một "Tenant" tương ứng với một "Cửa hàng" độc lập.
 *    - Controller này không xử lý logic bán hàng, mà chỉ xử lý việc Cấp phép (Provisioning) cửa hàng mới. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =================================================================================================
 */
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('tenant:create')
  @ApiCreateResponse('Tenant', { summary: 'Create a new Tenant (Store)' })
  async create(@Body() createTenantDto: CreateTenantDto) {
    const data = await this.tenantsService.create(createTenantDto);
    return { data };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('tenant:read')
  @ApiListResponse('Tenant', { summary: 'List all Tenants' })
  async findAll() {
    const data = await this.tenantsService.findAll();
    return { data };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('tenant:read')
  @ApiGetOneResponse('Tenant', {
    summary: 'Lấy thông tin store của tôi (Tenant Admin)',
  })
  async getMyTenant(@Request() req: any) {
    const tenantId = req.user.tenantId;
    if (!tenantId)
      throw new NotFoundException(
        'Your user is not associated with any tenant',
      );
    const data = await this.tenantsService.findOne(tenantId);
    return { data };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('tenant:read')
  @ApiGetOneResponse('Tenant', { summary: 'Get Tenant info by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.tenantsService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('tenant:update')
  @ApiUpdateResponse('Tenant', { summary: 'Update Tenant configuration' })
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    const data = await this.tenantsService.update(id, updateTenantDto);
    return { data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('tenant:delete')
  @ApiDeleteResponse('Tenant', { summary: 'Delete a Tenant' })
  async remove(@Param('id') id: string) {
    const data = await this.tenantsService.remove(id);
    return { data };
  }

  // PUBLIC ENDPOINT - No Guards
  @Get('current/config')
  @ApiOperation({ summary: 'Get current Tenant Configuration (Public)' })
  getTenantConfig() {
    const tenant = getTenant();

    if (!tenant) {
      return {
        data: {
          name: 'Platform Default',
          themeConfig: {
            primaryColor: '#000000',
            borderRadius: '0.5rem',
          },
        },
      };
    }

    return {
      data: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        themeConfig: tenant.themeConfig,
        plan: tenant.plan,
      },
    };
  }
}
