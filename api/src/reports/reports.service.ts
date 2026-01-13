import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Export danh sách đơn hàng
   */
  async exportOrdersToExcel(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format data for Excel (simplified - without exceljs dependency)
    const data = orders.map((order) => ({
      id: order.id,
      email: order.user?.email || 'N/A',
      name:
        `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() ||
        'N/A',
      total: Number(order.totalAmount),
      status: order.status,
      payment: order.paymentStatus,
      itemsCount: order.items.length,
      createdAt: order.createdAt.toISOString(),
    }));

    // Return JSON format (can be converted to CSV/Excel on frontend)
    return {
      type: 'orders',
      count: data.length,
      data,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Export danh sách sản phẩm tồn kho
   */
  async exportInventoryToExcel(tenantId: string) {
    const skus = await this.prisma.sku.findMany({
      where: {
        product: { tenantId },
      },
      include: {
        product: { select: { name: true, slug: true } },
      },
      orderBy: { stock: 'asc' },
    });

    const data = skus.map((sku) => ({
      skuCode: sku.skuCode,
      productName: sku.product?.name || 'N/A',
      stock: sku.stock,
      price: Number(sku.price),
      status: sku.stock < 10 ? 'LOW_STOCK' : 'OK',
    }));

    return {
      type: 'inventory',
      count: data.length,
      lowStockCount: data.filter((d) => d.status === 'LOW_STOCK').length,
      data,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Export báo cáo thuế
   */
  async exportTaxReportToExcel(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = {
      tenantId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const taxDetails = await this.prisma.orderTaxDetail.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            createdAt: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    const data = taxDetails.map((detail: any) => ({
      orderId: detail.orderId,
      orderDate: detail.order?.createdAt?.toISOString() || 'N/A',
      orderTotal: Number(detail.order?.totalAmount || 0),
      taxName: detail.name || 'N/A',
      taxRatePercent: Number(detail.rate),
      taxAmount: Number(detail.amount),
    }));

    const totalTax = data.reduce((sum, d) => sum + d.taxAmount, 0);

    return {
      type: 'tax_report',
      count: data.length,
      totalTax,
      data,
      generatedAt: new Date().toISOString(),
    };
  }
}
