import { PermissionsGuard } from '@/auth/permissions.guard';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

/**
 * =====================================================================
 * USERS CONTROLLER - Quản lý người dùng (Dành cho Admin)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ADMIN ONLY ACCESS:
 * - Toàn bộ Controller này được bảo vệ bởi `JwtAuthGuard` và `PermissionsGuard`.
 * - Khác với `AuthController` (nơi người dùng tự quản lý mình), đây là nơi Admin quản lý TẤT CẢ người dùng trong hệ thống.
 *
 * 2. GRANULAR PERMISSIONS:
 * - Mỗi API yêu cầu một quyền cụ thể: `user:read`, `user:create`, `user:update`, `user:delete`.
 * - Giúp phân chia công việc: Nhân viên hỗ trợ chỉ có quyền `read`, trong khi Quản lý có quyền `update/delete`.
 *
 * 3. ROLE ASSIGNMENT:
 * - API `:id/roles` cho phép Admin gán các vai trò (Role) cho người dùng, từ đó thay đổi quyền hạn của họ trong hệ thống.
 *
 * 4. PAGINATION & SEARCH:
 * - Hỗ trợ phân trang và tìm kiếm để Admin dễ dàng quản lý khi số lượng người dùng lên đến hàng ngàn. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

@ApiTags('Users (Admin)')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('user:create')
  @ApiCreateResponse('User', { summary: 'Create a new user (Admin)' })
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return { data };
  }

  @Get()
  @RequirePermissions('user:read')
  @ApiListResponse('User', { summary: 'Get list of users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Request() req?: any,
  ) {
    const tenantId = req?.user?.tenantId;
    const result = await this.usersService.findAll(
      Number(page),
      Number(limit),
      search,
      role,
      tenantId,
    );
    return result;
  }

  @Get(':id')
  @RequirePermissions('user:read')
  @ApiGetOneResponse('User', { summary: 'Get user details' })
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @RequirePermissions('user:update')
  @ApiUpdateResponse('User', { summary: 'Update user info' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const data = await this.usersService.update(id, updateUserDto);
    return { data };
  }

  @Post(':id/roles')
  @RequirePermissions('user:update')
  @ApiCreateResponse('User', { summary: 'Assign roles to user' })
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    const data = await this.usersService.assignRoles(id, dto.roles);
    return { data };
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  @ApiDeleteResponse('User', { summary: 'Delete user' })
  async remove(@Param('id') id: string) {
    const data = await this.usersService.remove(id);
    return { data };
  }
}
