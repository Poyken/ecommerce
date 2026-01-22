import { UserEntity } from '@/identity/auth/entities/user.entity';
import { PlanUsageService } from '@/identity/tenants/plan-usage.service';
import { AUTH_CONFIG } from '@core/config/constants';
import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { BaseCrudService } from '@/common/base-crud.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { createPaginatedResult } from '@/common/dto/base.dto';

/**
 * =====================================================================
 * USERS SERVICE - Logic nghiệp vụ quản lý người dùng
 * =====================================================================
 *
 * =====================================================================
 */

import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService extends BaseCrudService<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planUsageService: PlanUsageService,
    private readonly usersRepo: UsersRepository,
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

    // [PLAN LIMIT] Kiểm tra giới hạn nhân viên của Tenant
    const tenant = getTenant();
    if (tenant) {
      await this.planUsageService.checkStaffLimit(tenant.id);
    }

    const existingUser = await this.usersRepo.findFirst({
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

    const user = await this.usersRepo.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      tenantId: tenant!.id,
    });

    return new UserEntity(user);
  }

  /**
   * Lấy danh sách User (Phân trang).
   * - Trả về dữ liệu đã được serialize qua UserEntity (ẩn password, flatten roles).
   */
  async findAll(query: FilterUserDto, tenantId?: string) {
    const { page = 1, limit = 10, search, role } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    // [BẢO MẬT] Cô lập dữ liệu theo từng Tenant (User Isolation)
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

    const [items, total] = await Promise.all([
      this.usersRepo.findMany({
        where,
        skip,
        take: limit,
        include: {
          roles: { include: { role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.usersRepo.count(where),
    ]);

    return createPaginatedResult(
      items.map((user) => new UserEntity(user)),
      total,
      page,
      limit,
    );
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
    // Kiểm tra sự tồn tại trước khi update
    await this.findOneBase(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        AUTH_CONFIG.BCRYPT_ROUNDS,
      );
    }

    const updatedUser = await this.usersRepo.update(id, updateUserDto);

    return new UserEntity(updatedUser);
  }

  async remove(id: string) {
    // Kiểm tra sự tồn tại trước khi xóa
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
    const user = await this.usersRepo.findById(userId);
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
