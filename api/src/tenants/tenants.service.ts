import { AUTH_CONFIG } from '@core/config/constants';
import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
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
        let adminRole = await tx.role.findUnique({
          where: { name: 'ADMIN' },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
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
