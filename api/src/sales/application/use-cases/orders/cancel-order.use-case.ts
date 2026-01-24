import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  EntityNotFoundError,
  ForbiddenError,
} from '@/core/domain/errors/domain.error';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../../domain/repositories/order.repository.interface';
import { Order, OrderStatus } from '../../../domain/entities/order.entity';
import { InventoryService } from '@/catalog/skus/inventory.service';

export interface CancelOrderInput {
  orderId: string;
  userId: string;
  reason: string;
}

export type CancelOrderOutput = { order: Order };

@Injectable()
export class CancelOrderUseCase extends CommandUseCase<
  CancelOrderInput,
  CancelOrderOutput
> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly inventoryService: InventoryService,
  ) {
    super();
  }

  async execute(
    input: CancelOrderInput,
  ): Promise<Result<CancelOrderOutput, any>> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      return Result.fail(new EntityNotFoundError('Order', input.orderId));
    }

    // Security check
    if (order.customerId !== input.userId) {
      return Result.fail(
        new ForbiddenError('You do not have permission to cancel this order'),
      );
    }

    // Business rule check
    if (!order.canBeCancelled) {
      return Result.fail(
        new BadRequestException(
          `Order cannot be cancelled in status: ${order.status}`,
        ),
      );
    }

    try {
      order.cancel(input.reason);

      // Lưu thay đổi
      const savedOrder = await this.orderRepository.save(order);

      // Hoàn lại tồn kho
      for (const item of order.items) {
        await this.inventoryService.releaseStock(item.skuId, item.quantity);
      }

      return Result.ok({ order: savedOrder });
    } catch (error) {
      return Result.fail(error);
    }
  }
}
