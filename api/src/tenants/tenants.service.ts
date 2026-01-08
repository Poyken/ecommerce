import { AUTH_CONFIG } from '@core/config/constants';
import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
/**
 * =================================================================================================
 * TENANTS SERVICE - LOGIC NGHIỆP VỤ QUẢN LÝ CỬA HÀNG
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TRANSACTION (GIAO DỊCH NGUYÊN TỐ):
 *    - Khi tạo mới một Tenant (`create`), ta phải làm 2 việc:
 *      A. Tạo dòng dữ liệu trong bảng `Tenant`.
 *      B. Tạo tài khoản `User` (Admin) cho Tenant đó.
 *    - Vấn đề: Nếu A thành công mà B thất bại -> Dữ liệu rác (Cửa hàng không có chủ).
 *    - Giải pháp: Dùng `prisma.$transaction`. Nếu B lỗi, A sẽ tự động bị hủy (Rollback).
 *
 * 2. MẬT KHẨU (HASHING):
 *    - Mật khẩu admin KHÔNG ĐƯỢC lưu dưới dạng text (plain-text).
 *    - Bắt buộc phải mã hóa bằng `bcrypt` trước khi lưu vào DB.
 * =================================================================================================
 */
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    const { adminEmail, adminPassword, ...tenantData } = createTenantDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantData.name,
          domain: tenantData.domain,
          plan: tenantData.plan,
          themeConfig: tenantData.themeConfig || {},
        },
      });

      // 2. Create Admin User if requested
      if (adminEmail && adminPassword) {
        const hashedPassword = await bcrypt.hash(
          adminPassword,
          AUTH_CONFIG.BCRYPT_ROUNDS,
        );

        // Ensure ADMIN role exists
        let adminRole = await tx.role.findFirst({
          where: { name: 'ADMIN', tenantId: null },
        });

        if (!adminRole) {
          adminRole = await tx.role.create({
            data: { name: 'ADMIN' },
          });
        }

        await tx.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            firstName: tenant.name,
            lastName: 'Admin',
            tenantId: tenant.id,
            roles: {
              create: {
                roleId: adminRole.id,
              },
            },
          },
        });
      }

      return tenant;
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            orders: true,
          },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    // Ensure existence
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    // Check constraints (users, orders, etc.) or cascade?
    // Prisma usually handles cascade if defined, but Tenant deletion is dangerous.
    // For now, allow delete.
    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}
