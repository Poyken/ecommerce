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
  Request,
} from '@nestjs/common';

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
 * - Hỗ trợ phân trang và tìm kiếm để Admin dễ dàng quản lý khi số lượng người dùng lên đến hàng ngàn.
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
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users (Admin)')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Permissions('user:create')
  @ApiOperation({ summary: 'Create a new user (Admin)' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return { data };
  }

  @Get()
  @Permissions('user:read')
  @ApiOperation({ summary: 'Get list of users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return paginated users.' })
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
  @Permissions('user:read')
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({ status: 200, description: 'Return user details.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @Permissions('user:update')
  @ApiOperation({ summary: 'Update user info' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const data = await this.usersService.update(id, updateUserDto);
    return { data };
  }

  @Post(':id/roles')
  @Permissions('user:update')
  @ApiOperation({ summary: 'Assign roles to user' })
  @ApiResponse({ status: 200, description: 'Roles assigned successfully.' })
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    const data = await this.usersService.assignRoles(id, dto.roles);
    return { data };
  }

  @Delete(':id')
  @Permissions('user:delete')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  async remove(@Param('id') id: string) {
    const data = await this.usersService.remove(id);
    return { data };
  }
}
