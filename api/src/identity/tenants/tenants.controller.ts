import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
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
 * =================================================================================================
 */
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post('public-register')
  @ApiCreateResponse('Tenant', {
    summary: 'Public Register new Tenant',
  })
  async publicRegister(@Body() createTenantDto: CreateTenantDto) {
    const data = await this.tenantsService.create(createTenantDto);
    return { data };
  }

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
  @ApiDeleteResponse('Tenant', {
    summary: 'Soft Delete a Tenant (Move to Trash)',
  })
  async remove(@Param('id') id: string) {
    const data = await this.tenantsService.remove(id);
    return { data };
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('tenant:delete') // Reuse delete permission or add 'tenant:restore'
  @ApiUpdateResponse('Tenant', { summary: 'Restore a deleted Tenant' })
  async restore(@Param('id') id: string) {
    const data = await this.tenantsService.restore(id);
    return { data };
  }

  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('tenant:hard-delete') // New specific permission
  @ApiDeleteResponse('Tenant', {
    summary: 'Permanently Delete a Tenant (Cannot be undone)',
  })
  async hardDelete(@Param('id') id: string) {
    const data = await this.tenantsService.hardDelete(id);
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
