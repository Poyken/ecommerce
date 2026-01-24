import { Injectable, Inject, Logger } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import {
  IShipmentRepository,
  SHIPMENT_REPOSITORY,
} from '../../../domain/repositories/shipment.repository.interface';
import {
  Shipment,
  ShipmentStatus,
} from '../../../domain/entities/shipment.entity';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { EmailService } from '@integrations/email/email.service';
import { PrismaService } from '@core/prisma/prisma.service';

export interface UpdateShipmentStatusInput {
  trackingCode: string;
  status: ShipmentStatus;
  expectedDeliveryTime?: Date;
  reason?: string;
}

export type UpdateShipmentStatusOutput = { success: true };

@Injectable()
export class UpdateShipmentStatusUseCase extends CommandUseCase<
  UpdateShipmentStatusInput,
  UpdateShipmentStatusOutput
> {
  private readonly logger = new Logger(UpdateShipmentStatusUseCase.name);

  constructor(
    @Inject(SHIPMENT_REPOSITORY)
    private readonly shipmentRepository: IShipmentRepository,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async execute(
    input: UpdateShipmentStatusInput,
  ): Promise<Result<UpdateShipmentStatusOutput>> {
    const shipment = await this.shipmentRepository.findByTrackingCode(
      input.trackingCode,
    );
    if (!shipment) {
      return Result.fail(
        new EntityNotFoundError('Shipment', input.trackingCode),
      );
    }

    if (shipment.status === input.status) {
      return Result.ok({ success: true });
    }

    shipment.updateStatus(input.status);
    await this.shipmentRepository.save(shipment);

    // TODO: Trigger parent Order status update if necessary
    // This logic could be here or triggered via domain events/outbox

    this.logger.log(
      `Shipment ${shipment.id} status updated to ${input.status}`,
    );

    // Notify User
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: shipment.orderId },
        include: { user: true },
      });

      if (order?.user) {
        // Send Notification/Email logic here...
        // For brevity, using a placeholder logic similar to legacy ShippingService
      }
    } catch (e) {
      this.logger.error('Failed to send notification for shipment update', e);
    }

    return Result.ok({ success: true });
  }
}
