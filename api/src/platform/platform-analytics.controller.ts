import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { PrismaService } from '@core/prisma/prisma.service';

/**
 * =================================================================================================
 * PLATFORM ANALYTICS CONTROLLER - API THỐNG KÊ TOÀN NỀN TẢNG (SUPER ADMIN)
 * =================================================================================================
 *
 * =================================================================================================
 */
@ApiTags('Platform Analytics (Super Admin)')
@Controller('platform')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PlatformAnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /platform/stats
   * Lấy thống kê tổng quan của platform
   */
  @Get('stats')
  @RequirePermissions('platform:analytics:read')
  @ApiOperation({
    summary: 'Thống kê tổng quan platform',
    description:
      'Trả về số lượng tenants, doanh thu, active subscriptions, pending invoices',
  })
  async getPlatformStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Parallel queries for better performance
    const [
      totalTenants,
      activeTenants,
      newTenantsThisMonth,
      newTenantsLastMonth,
      activeSubscriptions,
      pendingInvoices,
      paidInvoicesThisMonth,
      planDistribution,
      recentTenants,
    ] = await Promise.all([
      // Total tenants (không tính deleted)
      this.prisma.tenant.count({
        where: { deletedAt: null },
      }),

      // Active tenants (isActive = true và không bị suspend)
      this.prisma.tenant.count({
        where: {
          isActive: true,
          suspendedAt: null,
          deletedAt: null,
        },
      }),

      // New tenants this month
      this.prisma.tenant.count({
        where: {
          createdAt: { gte: thisMonthStart },
          deletedAt: null,
        },
      }),

      // New tenants last month (for growth comparison)
      this.prisma.tenant.count({
        where: {
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
          deletedAt: null,
        },
      }),

      // Active subscriptions (Same as active tenants for now)
      this.prisma.tenant.count({
        where: {
          isActive: true,
          suspendedAt: null,
          deletedAt: null,
        },
      }),

      // Pending invoices
      this.prisma.invoice.count({
        where: { status: 'PENDING' },
      }),

      // Revenue this month (sum of paid invoices)
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: {
          status: 'PAID',
          paidAt: { gte: thisMonthStart },
        },
      }),

      // Plan distribution
      this.prisma.tenant.groupBy({
        by: ['plan'],
        _count: { _all: true },
        where: { deletedAt: null },
      }),

      // Recent 5 tenants
      this.prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          subdomain: true,
          plan: true,
          createdAt: true,
          isActive: true,
        },
      }),
    ]);

    // Calculate MRR (simplified: count active subscriptions * average plan price)
    // In production, use actual subscription amounts
    const mrr = paidInvoicesThisMonth._sum.amount || 0;

    // Calculate growth rate
    const growthRate =
      newTenantsLastMonth > 0
        ? ((newTenantsThisMonth - newTenantsLastMonth) / newTenantsLastMonth) *
          100
        : newTenantsThisMonth > 0
          ? 100
          : 0;

    // Calculate churn (simplified: tenants suspended/deleted this month)
    const churnedTenants = await this.prisma.tenant.count({
      where: {
        OR: [
          { suspendedAt: { gte: thisMonthStart } },
          { deletedAt: { gte: thisMonthStart } },
        ],
      },
    });
    const churnRate =
      activeTenants > 0 ? (churnedTenants / activeTenants) * 100 : 0;

    return {
      data: {
        // Tenant Stats
        totalTenants,
        activeTenants,
        newTenantsThisMonth,
        tenantGrowthRate: parseFloat(growthRate.toFixed(1)),
        churnRate: parseFloat(churnRate.toFixed(2)),

        // Revenue Stats
        mrr: Number(mrr),
        mrrFormatted: new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(Number(mrr)),

        // Subscription Stats
        activeSubscriptions,
        pendingInvoices,

        // Plan Distribution
        planDistribution: planDistribution.map((p) => ({
          plan: p.plan,
          count: p._count._all,
        })),

        // Recent Activity
        recentTenants,
      },
    };
  }

  /**
   * GET /platform/tenants
   * Lấy danh sách tenants với filter
   */
  @Get('tenants')
  @RequirePermissions('platform:analytics:read')
  @ApiOperation({
    summary: 'Danh sách tenants với filter',
    description: 'Hỗ trợ filter theo status, plan, date range',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'suspended', 'deleted'],
  })
  @ApiQuery({
    name: 'plan',
    required: false,
    enum: ['BASIC', 'PRO', 'ENTERPRISE'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or subdomain',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt', 'name', 'plan'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async getTenants(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = Math.min(parseInt(limit || '20', 10), 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (status === 'active') {
      where.isActive = true;
      where.suspendedAt = null;
      where.deletedAt = null;
    } else if (status === 'suspended') {
      where.suspendedAt = { not: null };
      where.deletedAt = null;
    } else if (status === 'deleted') {
      where.deletedAt = { not: null };
    } else {
      where.deletedAt = null; // Default: exclude deleted
    }

    if (plan) {
      where.plan = plan;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy || 'createdAt'] = sortOrder || 'desc';

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          owner: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          // subscription: {
          //   select: { status: true, currentPeriodEnd: true },
          // },
          _count: {
            select: { products: true, orders: true, users: true },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data: tenants,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * GET /platform/revenue-report
   * Báo cáo doanh thu theo thời gian
   */
  @Get('revenue-report')
  @RequirePermissions('platform:analytics:read')
  @ApiOperation({
    summary: 'Báo cáo doanh thu',
    description: 'Doanh thu theo ngày/tuần/tháng',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month'],
    example: 'month',
  })
  @ApiQuery({ name: 'startDate', required: false, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2024-12-31' })
  async getRevenueReport(
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000); // Default: last 12 months

    // Get paid invoices in date range
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: start, lte: end },
      },
      select: {
        amount: true,
        paidAt: true,
      },
      orderBy: { paidAt: 'asc' },
    });

    // Aggregate by period
    const aggregated: Record<string, number> = {};

    invoices.forEach((inv) => {
      if (!inv.paidAt) return;

      let key: string;
      const date = inv.paidAt;

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        }
        case 'month':
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      aggregated[key] = (aggregated[key] || 0) + Number(inv.amount);
    });

    const chartData = Object.entries(aggregated).map(([period, amount]) => ({
      period,
      amount,
    }));

    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + Number(inv.amount),
      0,
    );

    return {
      data: {
        chartData,
        summary: {
          totalRevenue,
          totalInvoices: invoices.length,
          avgInvoiceAmount:
            invoices.length > 0 ? totalRevenue / invoices.length : 0,
        },
      },
    };
  }
}
