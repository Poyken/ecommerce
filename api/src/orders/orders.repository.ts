import { Injectable } from '@nestjs/common';
import {
  BaseRepository,
  FindOptions,
  PaginatedResult,
} from '@core/repository/base.repository';
import { PrismaService } from '@core/prisma/prisma.service';
import { Order, Prisma, OrderStatus } from '@prisma/client';

/**
 * =====================================================================
 * ORDERS REPOSITORY - TRUY CẬP DỮ LIỆU ĐƠN HÀNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 *    - Tập trung tất cả các queries liên quan đến Order vào một nơi.
 *    - OrdersService sẽ gọi repository này thay vì gọi Prisma trực tiếp.
 *    - Giúp code clean hơn và dễ test hơn.
 *
 * 2. CÁC METHODS:
 *    - findByUser(): Lấy đơn hàng của một user cụ thể.
 *    - findByStatus(): Lọc theo trạng thái đơn hàng.
 *    - findWithItems(): Lấy đơn hàng kèm chi tiết items.
 *    - getStatistics(): Thống kê đơn hàng cho dashboard.
 *
 * 🎯 ỨNG DỤNG THỰC TẾ:
 * - Tách biệt data access logic ra khỏi business logic.
 * - Dễ dàng optimize queries ở một nơi tập trung.
 * - Có thể switch sang database khác mà không ảnh hưởng services.
 *
 * =====================================================================
 */

/**
 * Filter options cho orders
 */
export interface OrderFilterOptions {
  userId?: string;
  status?: OrderStatus | OrderStatus[];
  startDate?: Date;
  endDate?: Date;
  minTotal?: number;
  maxTotal?: number;
  search?: string;
  sortBy?: 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Order với đầy đủ relations
 */
export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    user: { select: { id: true; email: true; name: true } };
    items: {
      include: {
        sku: {
          include: {
            product: { select: { id: true; name: true; slug: true } };
          };
        };
      };
    };
    shippingAddress: true;
    billingAddress: true;
  };
}>;

/**
 * Order statistics for dashboard
 */
export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  recentOrders: Order[];
}

@Injectable()
export class OrdersRepository extends BaseRepository<Order> {
  protected readonly modelName = 'order';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Default includes cho order listing
   */
  private get defaultIncludes() {
    return {
      user: {
        select: { id: true, email: true, name: true },
      },
      items: {
        include: {
          sku: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { take: 1 },
                },
              },
            },
          },
        },
      },
      shippingAddress: true,
    };
  }

  /**
   * Full includes cho order detail
   */
  private get fullIncludes() {
    return {
      ...this.defaultIncludes,
      billingAddress: true,
      payments: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' as const },
      },
    };
  }

  /**
   * Tìm orders với filters phức tạp.
   * Đây là method chính cho admin order listing.
   */
  async findWithFilters(
    filter: OrderFilterOptions,
  ): Promise<PaginatedResult<OrderWithRelations>> {
    const whereConditions = this.buildWhereConditions(filter);
    const orderBy = this.buildOrderBy(filter.sortBy, filter.sortOrder);

    const page = filter.page || 1;
    const limit = Math.min(filter.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({
        where: whereConditions,
        orderBy,
        include: this.defaultIncludes,
        skip,
        take: limit,
      }),
      this.model.count({ where: whereConditions }),
    ]);

    const lastPage = Math.ceil(total / limit) || 1;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage,
        hasNextPage: page < lastPage,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Tìm orders của một user cụ thể
   */
  async findByUser(
    userId: string,
    options?: { page?: number; limit?: number; status?: OrderStatus },
  ): Promise<PaginatedResult<Order>> {
    return this.findManyPaginated(
      {
        where: {
          userId,
          ...(options?.status && { status: options.status }),
        },
        orderBy: { createdAt: 'desc' },
        include: this.defaultIncludes,
      },
      { page: options?.page, limit: options?.limit },
    );
  }

  /**
   * Tìm order theo ID với full details
   */
  async findByIdWithDetails(id: string): Promise<OrderWithRelations | null> {
    return await this.model.findFirst({
      where: this.withTenantFilter({ id }),
      include: this.fullIncludes,
    });
  }

  /**
   * Tìm order theo order number
   */
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return await this.model.findFirst({
      where: this.withTenantFilter({ orderNumber }),
      include: this.defaultIncludes,
    });
  }

  /**
   * Lấy orders theo status
   */
  async findByStatus(
    status: OrderStatus | OrderStatus[],
    options?: { page?: number; limit?: number },
  ): Promise<PaginatedResult<Order>> {
    const statusFilter = Array.isArray(status) ? { in: status } : status;

    return this.findManyPaginated(
      {
        where: { status: statusFilter },
        orderBy: { createdAt: 'desc' },
        include: this.defaultIncludes,
      },
      options,
    );
  }

  /**
   * Lấy thống kê đơn hàng cho dashboard
   */
  async getStatistics(options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<OrderStatistics> {
    const dateFilter = {
      ...(options?.startDate && { createdAt: { gte: options.startDate } }),
      ...(options?.endDate && { createdAt: { lte: options.endDate } }),
    };

    const [totals, byStatus, recent] = await Promise.all([
      // Tổng số đơn và doanh thu
      this.model.aggregate({
        where: this.withTenantFilter(dateFilter),
        _count: true,
        _sum: { total: true },
        _avg: { total: true },
      }),

      // Group by status
      this.model.groupBy({
        by: ['status'],
        where: this.withTenantFilter(dateFilter),
        _count: true,
      }),

      // Recent orders
      this.model.findMany({
        where: this.withTenantFilter(dateFilter),
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

    // Convert groupBy result to object
    const ordersByStatus = byStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      {} as Record<OrderStatus, number>,
    );

    return {
      totalOrders: totals._count || 0,
      totalRevenue: Number(totals._sum?.total || 0),
      averageOrderValue: Number(totals._avg?.total || 0),
      ordersByStatus,
      recentOrders: recent,
    };
  }

  /**
   * Cập nhật status đơn hàng
   */
  async updateStatus(id: string, newStatus: OrderStatus): Promise<Order> {
    // Verify order exists and belongs to tenant
    await this.findByIdOrThrow(id);

    return this.model.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  /**
   * Tìm orders cần xử lý (pending, processing)
   */
  async findPendingOrders(limit = 50): Promise<Order[]> {
    return await this.model.findMany({
      where: this.withTenantFilter({
        status: { in: ['PENDING', 'PROCESSING'] },
      }),
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: this.defaultIncludes,
    });
  }

  // =====================================================================
  // PRIVATE HELPERS
  // =====================================================================

  /**
   * Build where conditions từ filter options
   */
  private buildWhereConditions(
    filter: OrderFilterOptions,
  ): Prisma.OrderWhereInput {
    const conditions: any = {
      ...this.withTenantFilter(),
    };

    // User filter
    if (filter.userId) {
      conditions.userId = filter.userId;
    }

    // Status filter
    if (filter.status) {
      conditions.status = Array.isArray(filter.status)
        ? { in: filter.status }
        : filter.status;
    }

    // Date range
    if (filter.startDate || filter.endDate) {
      conditions.createdAt = {};
      if (filter.startDate) {
        conditions.createdAt.gte = filter.startDate;
      }
      if (filter.endDate) {
        conditions.createdAt.lte = filter.endDate;
      }
    }

    return conditions;
  }

  /**
   * Build orderBy clause
   */
  private buildOrderBy(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Prisma.OrderOrderByWithRelationInput {
    const order = sortOrder || 'desc';

    switch (sortBy) {
      case 'status':
        return { status: order };
      case 'createdAt':
      default:
        return { createdAt: order };
    }
  }
}
