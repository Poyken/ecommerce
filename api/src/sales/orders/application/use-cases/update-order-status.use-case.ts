import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '@/sales/domain/repositories/order.repository.interface';
import { OrderStatus } from '@/sales/domain/enums/order-status.enum';
import { ShippingService } from '@/sales/shipping/shipping.service';
import { InventoryService } from '@/catalog/skus/inventory.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { LoyaltyService } from '@/marketing/loyalty/loyalty.service';
import { EmailService } from '@integrations/email/email.service';

export interface UpdateOrderStatusInput {
  orderId: string;
  status: string;
  reason?: string;
  notify?: boolean;
}

export type UpdateOrderStatusOutput = { status: string };

@Injectable()
export class UpdateOrderStatusUseCase extends CommandUseCase<
  UpdateOrderStatusInput,
  UpdateOrderStatusOutput
> {
  private readonly logger = new Logger(UpdateOrderStatusUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly shippingService: ShippingService,
    private readonly inventoryService: InventoryService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly loyaltyService: LoyaltyService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async execute(
    input: UpdateOrderStatusInput,
  ): Promise<Result<UpdateOrderStatusOutput>> {
    const { orderId, reason, notify = true } = input;
    const newStatus = input.status as OrderStatus;

    try {
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        return Result.fail(new EntityNotFoundError('Order', orderId));
      }

      const oldStatus = order.status;

      // 1. Validate State Machine Transition
      if (!order.canTransitionTo(newStatus)) {
        return Result.fail(
          new BadRequestException(
            `Không thể chuyển trạng thái từ ${oldStatus} sang ${newStatus}`,
          ),
        );
      }

      // 2. Perform Status Change in Transaction
      await this.prisma.$transaction(async (tx) => {
        // Special logic for Cancellation
        if (newStatus === OrderStatus.CANCELLED) {
          // Release Stock
          for (const item of order.items) {
            await this.inventoryService.releaseStock(
              item.skuId,
              item.quantity,
              tx,
            );
          }
          order.cancel(reason || 'Admin cancelled');
        } else {
          order.startProcessing(); // Or other method from entity
          // Re-implement the state transition logic from Service to Entity if needed
        }

        await this.orderRepository.save(order);

        // Outbox event for side effects that should be reliable
        await tx.outboxEvent.create({
          data: {
            aggregateType: 'ORDER',
            aggregateId: order.id,
            type: `ORDER_STATUS_CHANGED_${newStatus}`,
            payload: {
              orderId: order.id,
              oldStatus,
              newStatus,
              reason,
            },
            tenantId: order.tenantId,
          },
        });
      });

      // 3. Fire-and-forget side effects (integrations)
      if (newStatus === OrderStatus.PROCESSING) {
        // Handle GHN Sync logic ...
      }

      return Result.ok({ status: order.status });
    } catch (error) {
      this.logger.error(`Failed to update status for order ${orderId}`, error);
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
