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
          // Grant default permissions to the Tenant Admin
          const defaultPermissions = [
            'admin:read',
            // Products
            'product:read',
            'product:create',
            'product:update',
            'product:delete',
            // Orders
            'order:read',
            'order:update',
            // Categories & Brands
            'category:read',
            'category:create',
            'category:update',
            'brand:read',
            'brand:create',
            'brand:update',
            // Analytics & Dashboard
            'analytics:read',
            // Reviews
            'review:read',
            'review:update',
            // Pages
            'page:read',
            'page:create',
            'page:update',
            // Users
            'user:read',
          ];

          const permissions = await tx.permission.findMany({
            where: { name: { in: defaultPermissions } },
          });

          // Ensure at least admin:read exists (create if missing - idempotent fallback)
          if (!permissions.find((p) => p.name === 'admin:read')) {
            const adminRead = await tx.permission.create({
              data: { name: 'admin:read' },
            });
            permissions.push(adminRead);
          }

          adminRole = await tx.role.create({
            data: {
              name: 'ADMIN',
              tenant: { connect: { id: tenant.id } },
              permissions: {
                create: permissions.map((p) => ({
                  permission: { connect: { id: p.id } },
                })),
              },
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

        // Seed default Category and Brand for the new tenant
        // This ensures the admin can create products immediately
        const defaultCategory = await tx.category.create({
          data: {
            name: 'General',
            slug: 'general',
            metaDescription: 'Default category',
            tenantId: tenant.id,
          },
        });

        const defaultBrand = await tx.brand.create({
          data: {
            name: 'Generic',
            slug: 'generic',
            tenantId: tenant.id,
          },
        });
      }

      return tenant;
    });
  }

  async findAll(includeDeleted = false) {
    const whereClause = includeDeleted ? {} : { deletedAt: null };
    return this.prisma.tenant.findMany({
      where: whereClause,
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
    // Nếu tenant không tồn tại hoặc đã bị xóa mềm -> Trả về lỗi
    if (!tenant || tenant.deletedAt)
      throw new NotFoundException('Tenant not found');
    return tenant;
  }

  // Phương thức tìm kiếm dành cho SuperAdmin (bao gồm cả tenant đã xóa)
  async findOneAdmin(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    // Kiểm tra sự tồn tại (bao gồm cả check deletedAt)
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  // Xóa mềm (Soft Delete) - Mặc định khi gọi API xóa
  async remove(id: string) {
    await this.findOne(id); // Check exists

    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Khôi phục Tenant đã xóa (Undo Soft Delete)
  async restore(id: string) {
    const tenant = await this.findOneAdmin(id); // Tìm cả tenant đã xóa
    if (!tenant.deletedAt) {
      return tenant; // Đã active thì không cần restore
    }

    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  // Xóa cứng (Hard Delete) - Chỉ SuperAdmin dùng, xóa vĩnh viễn khỏi DB
  async hardDelete(id: string) {
    const tenant = await this.findOneAdmin(id);

    // Thêm logic kiểm tra an toàn nếu cần (VD: Yêu cầu xác nhận lần 2)

    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}
