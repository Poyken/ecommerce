import { AUTH_CONFIG } from '@core/config/constants';
import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
/**
 * =================================================================================================
 * TENANTS SERVICE - LOGIC NGHIỆP VỤ QUẢN LÝ CỬA HÀNG (MULTI-TENANCY)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TRANSACTION (GIAO DỊCH NGUYÊN TỐ):
 *    - Khi tạo mới một Tenant (`create`), ta phải làm 2 việc cùng lúc:
 *      A. Tạo dòng dữ liệu trong bảng `Tenant` (Thông tin cửa hàng).
 *      B. Tạo tài khoản `User` (Admin) quản trị cho Tenant đó.
 *    - Vấn đề: Nếu A thành công nhưng B thất bại -> Dữ liệu rác (Cửa hàng không có chủ).
 *    - Giải pháp: Dùng `prisma.$transaction`. Nếu có bất kỳ lỗi nào xảy ra ở bước B, bước A sẽ tự động bị hủy bỏ (Rollback).
 *
 * 2. MẬT KHẨU AN TOÀN (Hashing):
 *    - Mật khẩu admin TUYỆT ĐỐI KHÔNG ĐƯỢC lưu dưới dạng text (plain-text).
 *    - Bắt buộc phải mã hóa một chiều bằng `bcrypt` trước khi lưu vào DB.
 *
 * 3. CASCADE DELETION (Xóa lan truyền) - CẨN TRỌNG:
 *    - Việc xóa một Tenant là thao tác cực kỳ nguy hiểm vì nó sẽ xóa toàn bộ dữ liệu liên quan (Sản phẩm, Đơn hàng, User...).
 *    - Hãy chắc chắn rằng bạn hiểu rõ cơ chế Cascade của DB hoặc xử lý Soft Delete. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =================================================================================================
 */
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    const { adminEmail, adminPassword, ...tenantData } = createTenantDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Tạo Tenant mới
      const tenant = await tx.tenant.create({
        data: {
          name: tenantData.name,
          domain: tenantData.domain,
          plan: tenantData.plan,
          themeConfig: tenantData.themeConfig || {},
        },
      });

      // 2. Tạo tài khoản Admin mặc định (nếu có yêu cầu)
      if (adminEmail && adminPassword) {
        const hashedPassword = await bcrypt.hash(
          adminPassword,
          AUTH_CONFIG.BCRYPT_ROUNDS,
        );

        // Đảm bảo role ADMIN tồn tại cho tenant này (hoặc tạo mới nếu chưa có)
        let adminRole = await tx.role.findFirst({
          where: { name: 'ADMIN', tenantId: tenant.id },
        });

        if (!adminRole) {
          adminRole = await tx.role.create({
            data: {
              name: 'ADMIN',
              tenant: { connect: { id: tenant.id } },
            },
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
    // Kiểm tra sự tồn tại
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    // Kiểm tra các ràng buộc (Cascade Delete?)
    // Prisma schema thường handle việc cascade, nhưng xóa Tenant là hành động nguy hiểm.
    // Hiện tại cho phép xóa trực tiếp. Cần cẩn trọng!
    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}
