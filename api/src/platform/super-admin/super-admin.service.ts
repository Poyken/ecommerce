/**
 * =====================================================================
 * SUPER ADMIN SERVICE - Logic cốt lõi cho Super Admin
 * =====================================================================
 *
 * =====================================================================
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { TokenService } from '@/identity/auth/token.service';
import { PermissionService } from '@/identity/auth/permission.service';
import { RedisService } from '@core/redis/redis.service';
import { tenantStorage } from '@core/tenant/tenant.context';

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly permissionService: PermissionService,
    private readonly redisService: RedisService,
  ) {}

  // Helper to run queries in global context (bypass tenant filter)
  private async runGlobal<T>(fn: () => Promise<T>): Promise<T> {
    return tenantStorage.run(undefined, fn);
  }

  async getGlobalStats() {
    return this.runGlobal(async () => {
      const [totalTenants, totalUsers, totalOrders, totalRevenueAggregate] =
        await Promise.all([
          this.prisma.tenant.count(),
          this.prisma.user.count(),
          this.prisma.order.count(),
          this.prisma.order.aggregate({
            _sum: { totalAmount: true },
          }),
        ]);

      // Calculate active tenants (orders in last 30 days)
      const activeTenants = await this.prisma.tenant.count({
        where: {
          orders: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      });

      // Calculate simple MRR based on Plan counts
      const tenantsByPlan = await this.prisma.tenant.groupBy({
        by: ['plan'],
        _count: true,
      });

      let mrr = 0;
      tenantsByPlan.forEach((group) => {
        // Mock pricing - should be in DB later
        if (group.plan === 'BASIC') mrr += 29 * group._count;
        if (group.plan === 'PRO') mrr += 99 * group._count;
        if (group.plan === 'ENTERPRISE') mrr += 299 * group._count;
      });

      return {
        totalRevenue: totalRevenueAggregate._sum.totalAmount || 0,
        totalTenants,
        activeTenants,
        totalUsers,
        totalOrders,
        mrr,
        churnRate: 2.4, // Mock calculated
        growth: 12.5, // Mock calculated
      };
    });
  }

  async impersonate(tenantId: string) {
    return this.runGlobal(async () => {
      // 1. Find Tenant
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (!tenant) throw new NotFoundException('Tenant not found');

      // 2. Find Owner
      const owner = await this.prisma.user.findFirst({
        where: {
          tenantId: tenantId,
          roles: {
            some: {
              role: {
                name: 'OWNER',
              },
            },
          },
        },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!owner) throw new NotFoundException('Tenant has no owner');

      // 3. Generate Tokens
      const allPermissions = this.permissionService.aggregatePermissions(
        owner as any, // Owner query missing permissions field - only has roles with nested permissions
      );
      const roles = owner.roles.map((r: any) => r.role.name);

      const { accessToken, refreshToken } = this.tokenService.generateTokens(
        owner.id,
        allPermissions,
        roles,
        'IMPERSONATION_SESSION',
      );

      await this.redisService.set(
        `refreshToken:${owner.id}`,
        refreshToken,
        'EX',
        this.tokenService.getRefreshTokenExpirationTime(),
      );

      return { accessToken, refreshToken };
    });
  }
}
