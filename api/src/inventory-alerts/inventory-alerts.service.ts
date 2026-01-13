import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { EmailService } from '@/integrations/email/email.service';
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
    this.logger.log('[Inventory Alerts] Checking low stock products...');

    // Lấy tất cả tenants có sản phẩm tồn kho thấp
    const lowStockByTenant = await this.prisma.sku.groupBy({
      by: ['productId'],
      where: {
        stock: { lt: this.LOW_STOCK_THRESHOLD },
      },
      _count: true,
    });

    if (lowStockByTenant.length === 0) {
      this.logger.log('[Inventory Alerts] No low stock products found');
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
      `[Inventory Alerts] Sent alerts to ${tenantIdSet.size} tenants`,
    );
  }

  /**
   * Gửi email cảnh báo tồn kho thấp cho một tenant
   */
  async sendLowStockAlertToTenant(tenantId: string) {
    try {
      const lowStock = await this.getLowStockProducts(tenantId);

      if (lowStock.count === 0) return;

      // Tìm admin users của tenant
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
            `• ${item.productName} (${item.skuCode}): ${item.currentStock} còn lại`,
        )
        .join('\n');

      const subject = `⚠️ Cảnh báo: ${lowStock.count} sản phẩm sắp hết hàng`;
      const html = `
        <h2>Cảnh báo tồn kho thấp</h2>
        <p>Có <strong>${lowStock.count}</strong> sản phẩm có tồn kho dưới ${this.LOW_STOCK_THRESHOLD}:</p>
        <pre>${productList}</pre>
        ${lowStock.count > 10 ? `<p>...và ${lowStock.count - 10} sản phẩm khác.</p>` : ''}
        <p><a href="#">Xem chi tiết trong Admin Dashboard</a></p>
      `;

      // Gửi email cho tất cả admin
      for (const admin of adminUsers) {
        await this.emailService.sendCustomEmail(admin.email, subject, html);
      }

      this.logger.log(
        `[Inventory Alerts] Sent to ${adminUsers.length} admins of tenant ${tenantId}`,
      );
    } catch (error) {
      this.logger.error(
        `[Inventory Alerts] Error sending alert for tenant ${tenantId}: ${error.message}`,
      );
    }
  }

  /**
   * Manual trigger để test alerts
   */
  async triggerManualAlert(tenantId: string) {
    await this.sendLowStockAlertToTenant(tenantId);
    return { success: true, message: 'Alert sent' };
  }
}
