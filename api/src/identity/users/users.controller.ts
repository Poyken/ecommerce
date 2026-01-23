import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import type { Request as ExpRequest, Response } from 'express';
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  Public,
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
import { FilterUserDto } from './dto/filter-user.dto';
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
 * - Tiếp nhận request từ Client, validate dữ liệu và điều phối xử lý logic thông qua các Service tương ứng.

 * =====================================================================
 */

import { Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation } from '@nestjs/swagger';
import { UsersExportService } from './users-export.service';
import { UsersImportService } from './users-import.service';
import { PermissionsGuard } from '@/identity/auth/permissions.guard'; // Added this import

@ApiTags('Users (Admin)')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly exportService: UsersExportService,
    private readonly importService: UsersImportService,
  ) {}

  @Get('export/excel')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Export Users to Excel' })
  async export(@Res() res: Response) {
    return this.exportService.exportToExcel(res);
  }

  @Get('import/template')
  @RequirePermissions('user:create')
  @ApiOperation({ summary: 'Download User Import Template' })
  async downloadTemplate(@Res() res: Response) {
    return this.importService.generateTemplate(res);
  }

  @Post('import/preview')
  @RequirePermissions('user:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiCreateResponse('any', { summary: 'Preview Import Users from Excel' })
  async preview(@UploadedFile() file: Express.Multer.File) {
    return this.importService.previewFromExcel(file);
  }

  @Post('import/excel')
  @RequirePermissions('user:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiCreateResponse('any', { summary: 'Import Users from Excel' })
  async import(@UploadedFile() file: Express.Multer.File) {
    return this.importService.importFromExcel(file);
  }

  @Post()
  @RequirePermissions('user:create')
  @ApiCreateResponse('User', { summary: 'Create a new user (Admin)' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions('user:read')
  @ApiListResponse('User', { summary: 'Get list of users' })
  async findAll(@Query() query: FilterUserDto, @Request() req?: ExpRequest) {
    const tenantId = (req as any)?.user?.tenantId;
    return this.usersService.findAll(query, tenantId);
  }

  @Get(':id')
  @RequirePermissions('user:read')
  @ApiGetOneResponse('User', { summary: 'Get user details' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('user:update')
  @ApiUpdateResponse('User', { summary: 'Update user info' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/roles')
  @RequirePermissions('user:update')
  @ApiCreateResponse('User', { summary: 'Assign roles to user' })
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    return this.usersService.assignRoles(id, dto.roles);
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  @ApiDeleteResponse('User', { summary: 'Delete user' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
