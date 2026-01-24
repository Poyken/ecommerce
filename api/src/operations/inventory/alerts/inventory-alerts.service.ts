/**
 * =====================================================================
 * INVENTORY ALERTS SERVICE - HỆ THỐNG CẢNH BÁO TỒN KHO
 * =====================================================================
 *
 * =====================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { EmailService } from '@/platform/integrations/external/email/email.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class InventoryAlertsService {
  private readonly logger = new Logger(InventoryAlertsService.name);
  private readonly LOW_STOCK_THRESHOLD = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Lấy danh sách sản phẩm có tồn kho thấp
   */
  async getLowStockProducts(tenantId: string) {
    const lowStockSkus = await this.prisma.sku.findMany({
      where: {
        product: { tenantId },
        stock: { lt: this.LOW_STOCK_THRESHOLD },
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { stock: 'asc' },
    });

    return {
      threshold: this.LOW_STOCK_THRESHOLD,
      count: lowStockSkus.length,
      items: lowStockSkus.map((sku) => ({
        skuId: sku.id,
        skuCode: sku.skuCode,
        productName: sku.product?.name,
        productSlug: sku.product?.slug,
        currentStock: sku.stock,
      })),
    };
  }

  /**
   * Kiểm tra tồn kho thấp và gửi email cảnh báo cho admin
   * Chạy mỗi ngày lúc 8:00 sáng
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkAndSendLowStockAlerts() {
    this.logger.log(
      '[Inventory Alerts] Đang kiểm tra danh sách sản phẩm sắp hết hàng...',
    );

    // Lấy tất cả tenants có sản phẩm tồn kho thấp
    const lowStockByTenant = await this.prisma.sku.groupBy({
      by: ['productId'],
      where: {
        stock: { lt: this.LOW_STOCK_THRESHOLD },
      },
      _count: true,
    });

    if (lowStockByTenant.length === 0) {
      this.logger.log('[Inventory Alerts] Không có sản phẩm nào sắp hết hàng');
      return;
    }

    // Lấy chi tiết và gửi email cho từng tenant
    const productIds = lowStockByTenant.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, tenantId: true },
    });

    const tenantIdSet = new Set(products.map((p) => p.tenantId));

    for (const tenantId of tenantIdSet) {
      await this.sendLowStockAlertToTenant(tenantId);
    }

    this.logger.log(
      `[Inventory Alerts] Đã gửi thông báo cho ${tenantIdSet.size} cửa hàng`,
    );
  }

  /**
   * Gửi email cảnh báo tồn kho thấp cho một tenant
   */
  async sendLowStockAlertToTenant(tenantId: string) {
    try {
      const lowStock = await this.getLowStockProducts(tenantId);

      if (lowStock.count === 0) return;

      // Tìm quản trị viên (ADMIN) của cửa hàng
      const adminUsers = await this.prisma.user.findMany({
        where: {
          tenantId,
          roles: {
            some: {
              role: { name: 'ADMIN' },
            },
          },
        },
        select: { email: true, firstName: true },
      });

      if (adminUsers.length === 0) return;

      // Tạo nội dung email
      const productList = lowStock.items
        .slice(0, 10) // Chỉ hiển thị top 10
        .map(
          (item) =>
            `• ${item.productName} (${item.skuCode}): còn ${item.currentStock} cái`,
        )
        .join('\n');

      const subject = `⚠️ Cảnh báo: ${lowStock.count} sản phẩm sắp hết hàng`;
      const html = `
        <h2>Cảnh báo tồn kho thấp</h2>
        <p>Có <strong>${lowStock.count}</strong> sản phẩm có tồn kho dưới ngưỡng an toàn (${this.LOW_STOCK_THRESHOLD}):</p>
        <pre>${productList}</pre>
        ${lowStock.count > 10 ? `<p>...và ${lowStock.count - 10} sản phẩm khác.</p>` : ''}
        <p><a href="#">Xem chi tiết trong trang Quản trị</a></p>
      `;

      // Gửi email cho tất cả admin
      for (const admin of adminUsers) {
        await this.emailService.sendCustomEmail(admin.email, subject, html);
      }

      this.logger.log(
        `[Inventory Alerts] Đã gửi thông báo tới ${adminUsers.length} admin của tenant ${tenantId}`,
      );
    } catch (error) {
      this.logger.error(
        `[Inventory Alerts] Lỗi gửi thông báo cho tenant ${tenantId}: ${error.message}`,
      );
    }
  }

  /**
   * Kích hoạt gửi thông báo thủ công (để test hoặc ép buộc gửi)
   */
  async triggerManualAlert(tenantId: string) {
    await this.sendLowStockAlertToTenant(tenantId);
    return { success: true, message: 'Đã gửi thông báo thành công' };
  }
}
