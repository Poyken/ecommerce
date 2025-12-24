import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryService } from 'src/products/skus/inventory.service';

@Processor('orders-queue')
export class OrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(OrdersProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'check-stock-release':
        return this.handleCheckStockRelease(job.data);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleCheckStockRelease(data: { orderId: string }) {
    this.logger.log(`[Job] Checking expiration for order ${data.orderId}`);

    // Check order status
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: { items: true },
    });

    if (!order) {
      this.logger.warn(
        `Order ${data.orderId} not found during expiration check.`,
      );
      return;
    }

    // POLICY: If order is still PENDING after timeout (15 mins), we cancel it and release stock.
    // PENDING usually means payment pending or confirmation pending.
    if (order.status === OrderStatus.PENDING) {
      this.logger.warn(
        `Order ${data.orderId} is still PENDING. Cancelling due to timeout.`,
      );

      try {
        await this.prisma.$transaction(async (tx) => {
          // 1. Cancel Order
          await tx.order.update({
            where: { id: data.orderId },
            data: { status: OrderStatus.CANCELLED },
          });

          // 2. Release Stock
          for (const item of order.items) {
            await this.inventoryService.releaseStock(
              item.skuId,
              item.quantity,
              tx,
            );
          }
        });
        this.logger.log(`Order ${data.orderId} cancelled and stock released.`);
      } catch (error) {
        this.logger.error(
          `Failed to release stock for order ${data.orderId}`,
          error,
        );
        throw error; // Let BullMQ retry? Maybe not loop forever.
      }
    } else {
      this.logger.log(
        `Order ${data.orderId} status is ${order.status}. No action taken.`,
      );
    }
  }
}
