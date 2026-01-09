import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { getTenant } from '@core/tenant/tenant.context';

/**
 * =====================================================================
 * ROLES SERVICE - Dịch vụ quản lý vai trò và phân quyền
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MANY-TO-MANY RELATIONSHIP:
 * - Mối quan hệ giữa `Role` và `Permission` là n-n (nhiều-nhiều).
 * - Ta sử dụng bảng trung gian `RolePermission` để lưu trữ các liên kết này.
 *
 * 2. ATOMIC ASSIGNMENT (Gán quyền nguyên tử):
 * - Trong hàm `assignPermissions`, ta sử dụng `$transaction` để đảm bảo:
 *   - Bước 1: Xóa sạch các quyền cũ của Role.
 *   - Bước 2: Thêm danh sách các quyền mới.
 * - Điều này giúp tránh việc bị trùng lặp hoặc sót quyền khi cập nhật.
 *
 * 3. CONFLICT HANDLING:
 * - Kiểm tra trùng tên (`findUnique`) trước khi tạo Role hoặc Permission mới để đảm bảo tính duy nhất trong hệ thống.
 *
 * 4. CASCADE DELETE:
 * - Khi xóa một Role hoặc Permission, các liên kết trong bảng `RolePermission` cũng cần được xử lý (thường là tự động xóa nhờ cấu hình Prisma/DB).
 * =====================================================================
 */

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo Role mới.
   * Ví dụ: "MANAGER", "SHIPPER".
   */
  async create(createRoleDto: CreateRoleDto) {
    const tenant = getTenant();
    if (!tenant) {
      throw new BadRequestException('Bối cảnh tenant bị thiếu');
    }
    const existing = await this.prisma.role.findFirst({
      where: {
        name: createRoleDto.name,
        tenantId: tenant.id,
      },
    });
    if (existing) {
      throw new ConflictException('Role này đã tồn tại');
    }
    return this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        tenant: { connect: { id: tenant.id } },
      },
    });
  }

  async findAll(search?: string, page = 1, limit = 10) {
    const tenant = getTenant();
    const where: any = {};
    if (tenant) {
      where.tenantId = tenant.id;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' as const };
    }
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: limit,
        include: {
          permissions: { select: { permission: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { select: { permission: true } },
      },
    });
    if (!role) throw new NotFoundException('Không tìm thấy Role');
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
    });
  }

  async remove(id: string) {
    return this.prisma.role.delete({ where: { id } });
  }

  /**
   * Gán danh sách Permission cho Role.
   * Ví dụ: Role "MANAGER" được quyền ["user:read", "product:create", ...].
   */
  async assignPermissions(id: string, dto: AssignPermissionsDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Không tìm thấy Role');

    // 1. Tìm ID của các permission dựa trên ID
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: dto.permissions } },
    });

    if (permissions.length !== dto.permissions.length) {
      throw new BadRequestException('Một số Permission không tồn tại');
    }

    // 2. Transaction: Xóa permission cũ -> Thêm permission mới
    return this.prisma.$transaction(async (tx) => {
      // Xóa các quyền hiện tại
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Thêm các quyền mới
      const data = permissions.map((p) => ({
        roleId: id,
        permissionId: p.id,
      }));

      await tx.rolePermission.createMany({ data });

      return tx.role.findUnique({
        where: { id },
        include: { permissions: { include: { permission: true } } },
      });
    });
  }

  // ============= QUẢN LÝ QUYỀN HẠN =============
  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createPermission(dto: CreatePermissionDto) {
    const existing = await this.prisma.permission.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Permission này đã tồn tại');
    }
    return this.prisma.permission.create({ data: dto });
  }

  async updatePermission(id: string, dto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Không tìm thấy Permission');
    }
    return this.prisma.permission.update({
      where: { id },
      data: dto,
    });
  }

  async deletePermission(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Không tìm thấy Permission');
    }
    // Xóa quyền và tất cả các liên kết của nó
    return this.prisma.permission.delete({ where: { id } });
  }
}
