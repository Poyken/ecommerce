import { Injectable, Logger, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IShipmentRepository,
  SHIPMENT_REPOSITORY,
} from '@/sales/domain/repositories/shipment.repository.interface';
import { ShipmentStatus } from '@/sales/domain/entities/shipment.entity';
import { UpdateOrderStatusUseCase } from '@/sales/orders/application/use-cases/update-order-status.use-case';
import { OrderStatus } from '@/sales/domain/enums/order-status.enum';

export interface UpdateShipmentStatusInput {
  trackingCode: string;
  status: ShipmentStatus;
  location?: string;
  carrier?: string;
  expectedDeliveryTime?: Date;
  reason?: string;
}

@Injectable()
export class UpdateShipmentStatusUseCase extends CommandUseCase<
  UpdateShipmentStatusInput,
  void
> {
  private readonly logger = new Logger(UpdateShipmentStatusUseCase.name);

  constructor(
    @Inject(SHIPMENT_REPOSITORY)
    private readonly shipmentRepository: IShipmentRepository,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {
    super();
  }

  async execute(input: UpdateShipmentStatusInput): Promise<Result<void>> {
    const { trackingCode, status, reason } = input;
    this.logger.log(`Updating shipment ${trackingCode} to ${status}`);

    try {
      const shipment =
        await this.shipmentRepository.findByTrackingCode(trackingCode);
      if (!shipment) {
        return Result.fail(
          new Error(`Shipment with tracking code ${trackingCode} not found`),
        );
      }

      // 1. Update Shipment Entity mapping
      shipment.updateStatus(status);
      await this.shipmentRepository.save(shipment);

      // 2. Map ShipmentStatus to OrderStatus and trigger update
      let orderStatus: OrderStatus | null = null;

      switch (status) {
        case ShipmentStatus.SHIPPED:
          orderStatus = OrderStatus.SHIPPED;
          break;
        case ShipmentStatus.DELIVERED:
          orderStatus = OrderStatus.DELIVERED;
          break;
        case ShipmentStatus.FAILED:
        case ShipmentStatus.RETURNED:
          // Keep as is or mark as something specific.
          break;
      }

      if (orderStatus) {
        await this.updateOrderStatusUseCase.execute({
          orderId: shipment.orderId,
          status: orderStatus,
          reason: reason || `Shipment status updated to ${status}`,
          notify: true,
        });
      }

      return Result.ok(undefined);
    } catch (error) {
      this.logger.error(`Failed to update shipment status: ${error.message}`);
      return Result.fail(error);
    }
  }
}
