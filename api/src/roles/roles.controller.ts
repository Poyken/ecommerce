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
 * 3. DYNAMIC ASSIGNMENT:
 * - `assignPermissions`: API quan trọng nhất, cho phép gán một danh sách các quyền cho một vai trò cụ thể.
 * - Giúp hệ thống linh hoạt, có thể thay đổi quyền hạn của một nhóm người dùng ngay lập tức mà không cần sửa code.
 * =====================================================================
 */
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles (Admin)')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Permissions('role:create') // Đảm bảo bạn seed quyền này
  @ApiOperation({ summary: 'Tạo vai trò mới' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @Permissions('role:read')
  @ApiOperation({ summary: 'Lấy tất cả vai trò' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.rolesService.findAll(search, Number(page), Number(limit));
  }

  // ============= QUẢN LÝ QUYỀN HẠN =============
  @Get('permissions')
  @UseGuards(JwtAuthGuard) // Ghi đè guard của controller - chỉ cần xác thực JWT
  @ApiOperation({ summary: 'Lấy tất cả quyền hạn' })
  getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }

  @Post('permissions')
  @Permissions('permission:create')
  @ApiOperation({ summary: 'Tạo quyền hạn mới' })
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.rolesService.createPermission(dto);
  }

  @Patch('permissions/:id')
  @Permissions('permission:update')
  @ApiOperation({ summary: 'Cập nhật quyền hạn' })
  updatePermission(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.rolesService.updatePermission(id, dto);
  }

  @Delete('permissions/:id')
  @Permissions('permission:delete')
  @ApiOperation({ summary: 'Xóa quyền hạn' })
  deletePermission(@Param('id') id: string) {
    return this.rolesService.deletePermission(id);
  }

  @Get(':id')
  @Permissions('role:read')
  @ApiOperation({ summary: 'Lấy chi tiết vai trò' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('role:update')
  @ApiOperation({ summary: 'Cập nhật vai trò' })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @Permissions('role:delete')
  @ApiOperation({ summary: 'Xóa vai trò' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  @Permissions('role:update')
  @ApiOperation({ summary: 'Gán quyền hạn cho vai trò' })
  @ApiResponse({
    status: 200,
    description: 'Đã gán quyền hạn thành công.',
  })
  assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, dto);
  }
}
