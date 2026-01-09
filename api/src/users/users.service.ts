import { UserEntity } from '@/auth/entities/user.entity';
import { AUTH_CONFIG } from '@core/config/constants';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { BaseCrudService } from '../common/base-crud.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * =====================================================================
 * USERS SERVICE - Logic nghiệp vụ quản lý người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PAGINATION & SEARCH (Phân trang và Tìm kiếm):
 * - `findAll`: Sử dụng `skip` và `take` của Prisma để lấy đúng số lượng bản ghi cần thiết.
 * - `Promise.all`: Chạy song song việc đếm tổng số bản ghi và lấy dữ liệu trang hiện tại để tối ưu hiệu năng.
 * - `mode: 'insensitive'`: Giúp tìm kiếm không phân biệt chữ hoa chữ thường.
 *
 * 2. DATABASE TRANSACTIONS:
 * - `assignRoles`: Sử dụng `$transaction` để đảm bảo tính toàn vẹn dữ liệu.
 * - Nếu việc xóa role cũ thành công nhưng thêm role mới bị lỗi, toàn bộ quá trình sẽ được "Rollback" (hủy bỏ), tránh tình trạng user bị mất hết role.
 *
 * 3. DATA SERIALIZATION:
 * - Mọi dữ liệu trả về đều được bọc trong `new UserEntity(user)`.
 * - Điều này kích hoạt các Decorator của `class-transformer` để ẩn mật khẩu và làm phẳng (Flatten) các quan hệ phức tạp.
 *
 * 4. ERROR HANDLING:
 * - Sử dụng các Exception chuẩn của NestJS (`ConflictException`, `NotFoundException`) để trả về mã lỗi HTTP và thông báo rõ ràng cho Client.
 * =====================================================================
 */

import { PlanUsageService } from '@/tenants/plan-usage.service';
import { getTenant } from '@core/tenant/tenant.context';

// ... imports

@Injectable()
export class UsersService extends BaseCrudService<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planUsageService: PlanUsageService,
  ) {
    super(UsersService.name);
  }

  protected get model() {
    return this.prisma.user;
  }

  private readonly USER_FULL_SELECT = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
    createdAt: true,
    permissions: {
      select: {
        permission: {
          select: { name: true },
        },
      },
    },
    roles: {
      select: {
        role: {
          select: {
            name: true,
            permissions: {
              select: {
                permission: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    },
  };

  /**
   * Tạo User mới (Admin tạo).
   * - Hash password trước khi lưu.
   * - Check trùng email.
   */
  async create(createUserDto: CreateUserDto) {
    const { email, password, firstName, lastName } = createUserDto;

    // [PLAN LIMIT] Check staff limit
    const tenant = getTenant();
    if (tenant) {
      await this.planUsageService.checkStaffLimit(tenant.id);
    }

    const existingUser = await this.model.findFirst({
      where: {
        email,
        tenantId: tenant?.id,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(
      password,
      AUTH_CONFIG.BCRYPT_ROUNDS,
    );

    const user = await this.model.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        tenantId: tenant!.id,
      },
    });

    return new UserEntity(user);
  }

  /**
   * Lấy danh sách User (Phân trang).
   * - Trả về dữ liệu đã được serialize qua UserEntity (ẩn password, flatten roles).
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
    tenantId?: string,
  ) {
    const where: Prisma.UserWhereInput = {};

    // [SECURITY] User Isolation
    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (role && role !== 'all') {
      where.roles = {
        some: {
          role: {
            name: role,
          },
        },
      };
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Use BaseCrudService helper
    const result = await this.findAllBase(
      page,
      limit,
      where,
      {
        roles: { include: { role: true } },
      },
      { createdAt: 'desc' },
    );

    // Map to UserEntity
    const data = result.data.map((user) => new UserEntity(user));

    return {
      ...result,
      data,
    };
  }

  async findOne(id: string) {
    const user = await this.findOneBase(id, {
      select: {
        ...this.USER_FULL_SELECT,
      },
    });

    return new UserEntity(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Check existence
    await this.findOneBase(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        AUTH_CONFIG.BCRYPT_ROUNDS,
      );
    }

    const updatedUser = await this.model.update({
      where: { id },
      data: updateUserDto,
    });

    return new UserEntity(updatedUser);
  }

  async remove(id: string) {
    // Check existence
    await this.findOneBase(id);

    await this.softDeleteBase(id);

    return { message: 'Xóa user thành công' };
  }

  /**
   * Gán Roles cho User.
   * - Xóa roles cũ -> Gán roles mới (Transaction).
   * - Input: mảng tên Role ["ADMIN", "MANAGER"].
   */
  async assignRoles(userId: string, roleNames: string[]) {
    // 1. Validate User
    const user = await this.model.findFirst({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    // 2. Validate Roles (có 존재 hay không)
    const roles = await this.prisma.role.findMany({
      where: { name: { in: roleNames } },
    });

    if (roles.length !== roleNames.length) {
      throw new BadRequestException('Một số Role không tồn tại trong hệ thống');
    }

    // 3. Update Roles (Transaction)
    return this.prisma.$transaction(async (tx) => {
      // Xóa hết role cũ
      await tx.userRole.deleteMany({ where: { userId } });

      // Thêm role mới
      await tx.userRole.createMany({
        data: roles.map((role) => ({
          userId,
          roleId: role.id,
        })),
      });

      // Trả về User đã update
      const updatedUser = await tx.user.findFirst({
        where: { id: userId },
        select: {
          ...this.USER_FULL_SELECT,
        },
      });

      if (!updatedUser) {
        throw new Error('Failed to fetch updated user');
      }
      return new UserEntity(updatedUser);
    });
  }
}
