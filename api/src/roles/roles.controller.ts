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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from 'src/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/permissions.guard';
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
  findAll(@Query('search') search?: string) {
    return this.rolesService.findAll(search);
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
