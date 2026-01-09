import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

/**
 * =====================================================================
 * ROLES CONTROLLER - Quản lý vai trò và quyền hạn (RBAC)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RBAC (Role-Based Access Control):
 * - Đây là trung tâm quản lý phân quyền của toàn bộ hệ thống.
 * - `@Permissions('role:create')`: Kiểm tra xem user có quyền cụ thể để thực hiện hành động này không.
 *
 * 2. PERMISSION MANAGEMENT:
 * - Không chỉ quản lý vai trò (Role), controller này còn quản lý cả danh sách các quyền (Permission) thô.
 * - Cho phép Admin tạo mới, cập nhật hoặc xóa các quyền hạn trong hệ thống.
 *
 * 3. RESPONSE STANDARDIZATION:
 * - Các API trả về object được wrap trong `{ data: ... }` để đồng bộ với Frontend.
 * - Ngoại trừ API List có phân trang trả về `{ data, meta }` trực tiếp.
 * =====================================================================
 */
@ApiTags('Roles (Admin)')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions('role:create')
  @ApiCreateResponse('Role', { summary: 'Tạo vai trò mới' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    const data = await this.rolesService.create(createRoleDto);
    return { data };
  }

  @Get()
  @RequirePermissions('role:read')
  @ApiListResponse('Role', { summary: 'Lấy tất cả vai trò' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    // Service returns { data, meta } -> No wrap needed
    return this.rolesService.findAll(search, Number(page), Number(limit));
  }

  // ============= QUẢN LÝ QUYỀN HẠN =============
  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiListResponse('Permission', { summary: 'Lấy tất cả quyền hạn' })
  async getAllPermissions() {
    const data = await this.rolesService.getAllPermissions();
    return { data };
  }

  @Post('permissions')
  @RequirePermissions('permission:create')
  @ApiCreateResponse('Permission', { summary: 'Tạo quyền hạn mới' })
  async createPermission(@Body() dto: CreatePermissionDto) {
    const data = await this.rolesService.createPermission(dto);
    return { data };
  }

  @Patch('permissions/:id')
  @RequirePermissions('permission:update')
  @ApiUpdateResponse('Permission', { summary: 'Cập nhật quyền hạn' })
  async updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    const data = await this.rolesService.updatePermission(id, dto);
    return { data };
  }

  @Delete('permissions/:id')
  @RequirePermissions('permission:delete')
  @ApiDeleteResponse('Permission', { summary: 'Xóa quyền hạn' })
  async deletePermission(@Param('id') id: string) {
    const data = await this.rolesService.deletePermission(id);
    return { data };
  }

  // ============= CHI TIẾT VAI TRÒ =============

  @Get(':id')
  @RequirePermissions('role:read')
  @ApiGetOneResponse('Role', { summary: 'Lấy chi tiết vai trò' })
  async findOne(@Param('id') id: string) {
    const data = await this.rolesService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @RequirePermissions('role:update')
  @ApiUpdateResponse('Role', { summary: 'Cập nhật vai trò' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    const data = await this.rolesService.update(id, updateRoleDto);
    return { data };
  }

  @Delete(':id')
  @RequirePermissions('role:delete')
  @ApiDeleteResponse('Role', { summary: 'Xóa vai trò' })
  async remove(@Param('id') id: string) {
    const data = await this.rolesService.remove(id);
    return { data };
  }

  @Post(':id/permissions')
  @RequirePermissions('role:update')
  @ApiUpdateResponse('Role', { summary: 'Gán quyền hạn cho vai trò' })
  async assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    const data = await this.rolesService.assignPermissions(id, dto);
    return { data };
  }
}
