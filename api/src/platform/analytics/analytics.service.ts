/**
 * =====================================================================
 * ANALYTICS SERVICE - HỆ THỐNG THỐNG KÊ & BÁO CÁO
 * =====================================================================
 *
 * =====================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy tổng quan dashboard cho quản trị viên
   */
  async getDashboardOverview(tenantId: string) {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Chạy các truy vấn song song để tăng tốc độ phản hồi
    const [
      todayOrders,
      monthOrders,
      todayRevenue,
      monthRevenue,
      pendingOrders,
      totalCustomers,
      lowStockProducts,
      totalLoyaltyPoints,
    ] = await Promise.all([
      // Số đơn hàng hôm nay
      this.prisma.order.count({
        where: {
          tenantId,
          createdAt: { gte: startOfToday },
          deletedAt: null,
        },
      }),
      // Số đơn hàng trong tháng
      this.prisma.order.count({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
          deletedAt: null,
        },
      }),
      // Doanh thu hôm nay (chỉ tính đơn đã giao thành công)
      this.prisma.order.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfToday },
          status: OrderStatus.DELIVERED,
          deletedAt: null,
        },
        _sum: { totalAmount: true },
      }),
      // Doanh thu trong tháng
      this.prisma.order.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
          status: OrderStatus.DELIVERED,
          deletedAt: null,
        },
        _sum: { totalAmount: true },
      }),
      // Đơn hàng đang chờ xử lý (PENDING)
      this.prisma.order.count({
        where: {
          tenantId,
          status: OrderStatus.PENDING,
          deletedAt: null,
        },
      }),
      // Tổng số khách hàng của shop
      this.prisma.user.count({
        where: { tenantId },
      }),
      // Sản phẩm sắp hết hàng (tồn kho < 10)
      this.prisma.sku.count({
        where: {
          product: { tenantId },
          stock: { lt: 10 },
        },
      }),
      // Tổng số điểm thưởng đã phát hành
      this.prisma.loyaltyPoint.aggregate({
        where: {
          tenantId,
          amount: { gt: 0 },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      orders: {
        today: todayOrders,
        month: monthOrders,
        pending: pendingOrders,
      },
      revenue: {
        today: Number(todayRevenue._sum.totalAmount || 0),
        month: Number(monthRevenue._sum.totalAmount || 0),
      },
      customers: {
        total: totalCustomers,
      },
      inventory: {
        lowStock: lowStockProducts,
      },
      loyalty: {
        totalPointsIssued: totalLoyaltyPoints._sum.amount || 0,
      },
    };
  }

  /**
   * Lấy thống kê doanh thu theo ngày trong 30 ngày gần nhất (cho biểu đồ)
   */
  async getRevenueChart(tenantId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.prisma.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
        status: OrderStatus.DELIVERED,
        deletedAt: null,
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
    });

    // Nhóm dữ liệu theo ngày
    const revenueByDate: Record<string, number> = {};
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      revenueByDate[dateKey] =
        (revenueByDate[dateKey] || 0) + Number(order.totalAmount);
    }

    return Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }

  /**
   * Lấy danh sách sản phẩm bán chạy nhất
   */
  async getTopProducts(tenantId: string, limit = 10) {
    const orderItems = await this.prisma.orderItem.groupBy({
      by: ['skuId'],
      where: {
        order: {
          tenantId,
          status: OrderStatus.DELIVERED,
          deletedAt: null,
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const skuIds = orderItems.map((item) => item.skuId);
    const skus = await this.prisma.sku.findMany({
      where: { id: { in: skuIds } },
      include: {
        product: { select: { name: true, slug: true } },
      },
    });

    return orderItems.map((item) => {
      const sku = skus.find((s) => s.id === item.skuId);
      return {
        skuId: item.skuId,
        skuCode: sku?.skuCode,
        productName: sku?.product?.name,
        productSlug: sku?.product?.slug,
        totalSold: item._sum.quantity,
      };
    });
  }

  /**
   * Thống kê tỷ lệ đơn hàng theo trạng thái
   */
  async getOrdersByStatus(tenantId: string) {
    const statuses = await this.prisma.order.groupBy({
      by: ['status'],
      where: {
        tenantId,
        deletedAt: null,
      },
      _count: true,
    });

    return statuses.map((s) => ({
      status: s.status,
      count: s._count,
    }));
  }
}
