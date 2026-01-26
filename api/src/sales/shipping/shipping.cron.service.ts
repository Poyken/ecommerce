import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@core/prisma/prisma.service';
import { GHNService } from './ghn.service';
import { UpdateShipmentStatusUseCase } from './application/use-cases/update-shipment-status.use-case';
import { ShipmentStatus } from '../domain/entities/shipment.entity';

/**
 * =====================================================================
 * SHIPPING CRON SERVICE - ĐỒNG BỘ TRẠNG THÁI VẬN CHUYỂN TỰ ĐỘNG
 * =====================================================================
 */
@Injectable()
export class ShippingCronService {
  private readonly logger = new Logger(ShippingCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ghnService: GHNService,
    private readonly updateShipmentStatusUseCase: UpdateShipmentStatusUseCase,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    this.logger.log('Starting backup shipping status sync (Cron Job)...');

    // Find shipments that haven't been updated in 30 minutes
    const staleShipments = await this.prisma.shipment.findMany({
      where: {
        status: {
          in: ['PENDING', 'READY_TO_SHIP', 'SHIPPED'],
        },
        trackingCode: {
          not: null,
        },
        updatedAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000),
        },
      },
      take: 20,
      orderBy: { updatedAt: 'asc' },
    });

    if (staleShipments.length === 0) return;

    this.logger.log(`Found ${staleShipments.length} stale shipments to sync.`);

    for (const shipment of staleShipments) {
      if (!shipment.trackingCode) continue;

      try {
        const detail = await this.ghnService.getOrderDetail(
          shipment.trackingCode,
        );
        if (!detail) {
          // Toggle updateAt to prevent starvation
          await this.prisma.shipment.update({
            where: { id: shipment.id },
            data: { updatedAt: new Date() },
          });
          continue;
        }

        const ghnStatus = detail.status.toLowerCase();
        const statusMapping: Record<string, ShipmentStatus> = {
          ready_to_pick: ShipmentStatus.READY_TO_SHIP,
          picking: ShipmentStatus.READY_TO_SHIP,
          picked: ShipmentStatus.SHIPPED,
          delivering: ShipmentStatus.SHIPPED,
          money_collect_delivering: ShipmentStatus.SHIPPED,
          delivered: ShipmentStatus.DELIVERED,
          cancel: ShipmentStatus.FAILED,
          return: ShipmentStatus.RETURNED,
          returned: ShipmentStatus.RETURNED,
        };

        const newStatus = statusMapping[ghnStatus];
        if (newStatus && newStatus !== shipment.status) {
          await this.updateShipmentStatusUseCase.execute({
            trackingCode: shipment.trackingCode,
            status: newStatus,
            reason: 'Cron sync',
          });
          this.logger.log(`Shipment ${shipment.id} updated via Cron.`);
        } else {
          // Mark as checked
          await this.prisma.shipment.update({
            where: { id: shipment.id },
            data: { updatedAt: new Date() },
          });
        }
      } catch (error) {
        this.logger.error(
          `Failed to sync shipment ${shipment.id}: ${error.message}`,
        );
      }
    }
  }
}
