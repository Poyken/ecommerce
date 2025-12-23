import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserEntity } from 'src/auth/entities/user.entity';
import { PrismaService } from 'src/prisma/prisma.service';
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

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo User mới (Admin tạo).
   * - Hash password trước khi lưu.
   * - Check trùng email.
   */
  async create(createUserDto: CreateUserDto) {
    const { email, password, firstName, lastName } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    return new UserEntity(user);
  }

  /**
   * Lấy danh sách User (Phân trang).
   * - Trả về dữ liệu đã được serialize qua UserEntity (ẩn password, flatten roles).
   */
  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          roles: { include: { role: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => new UserEntity(user)),
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        // Load full permission rights (Direct + Role-based)
        permissions: { include: { permission: true } },
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy User ID ${id}`);
    }

    return new UserEntity(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy User ID ${id}`);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return new UserEntity(updatedUser);
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy User ID ${id}`);
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Xóa user thành công' };
  }

  /**
   * Gán Roles cho User.
   * - Xóa roles cũ -> Gán roles mới (Transaction).
   * - Input: mảng tên Role ["ADMIN", "MANAGER"].
   */
  async assignRoles(userId: string, roleNames: string[]) {
    // 1. Validate User
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
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
      const updatedUser = await tx.user.findUnique({
        where: { id: userId },
        include: { roles: { include: { role: true } } },
      });

      return new UserEntity(updatedUser);
    });
  }
}
