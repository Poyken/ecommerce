import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../../domain/repositories/order.repository.interface';
import { Order, OrderStatus } from '../../../domain/entities/order.entity';
import { InventoryService } from '@/catalog/skus/inventory.service';
import { ShippingService } from '@/sales/shipping/shipping.service';

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
  note?: string;
  trackingNumber?: string;
  carrier?: string;
}

export type UpdateOrderStatusOutput = { order: Order };

@Injectable()
export class UpdateOrderStatusUseCase extends CommandUseCase<
  UpdateOrderStatusInput,
  UpdateOrderStatusOutput
> {
  private readonly logger = new Logger(UpdateOrderStatusUseCase.name);

  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly inventoryService: InventoryService,
    private readonly shippingService: ShippingService,
  ) {
    super();
  }

  async execute(
    input: UpdateOrderStatusInput,
  ): Promise<Result<UpdateOrderStatusOutput, any>> {
    const order = await this.orderRepository.findById(input.orderId);

    if (!order) {
      return Result.fail(new EntityNotFoundError('Order', input.orderId));
    }

    try {
      const oldStatus = order.status;
      const newStatus = input.status;

      // Logic chuyển đổi trạng thái (State Machine logic is already inside Order entity)
      switch (newStatus) {
        case OrderStatus.CONFIRMED:
          // TODO: Implement confirmation logic (usually from payment webhook)
          // order.confirm(paymentId, transactionId);
          break;

        case OrderStatus.PROCESSING:
          order.startProcessing();
          break;

        case OrderStatus.SHIPPED:
          // Tích hợp vận chuyển (GHN)
          if (!input.trackingNumber && !order.shipping.trackingNumber) {
            // Logic tạo vận đơn GHN nếu chưa có
            // const ghnResponse = await this.shippingService.createOrder(...);
            // order.ship(ghnResponse.trackingCode, 'GHN');
          } else {
            order.ship(input.trackingNumber || '', input.carrier || 'Standard');
          }
          break;

        case OrderStatus.DELIVERED:
          order.markDelivered();
          // Khi giao thành công -> Trừ kho thực tế (Deduce reserved stock)
          for (const item of order.items) {
            await this.inventoryService.deductStock(item.skuId, item.quantity);
          }
          break;

        case OrderStatus.CANCELLED:
          order.cancel(input.note || 'Cancelled by admin');
          // Khi hủy đơn -> Hoàn lại tồn kho
          for (const item of order.items) {
            await this.inventoryService.releaseStock(item.skuId, item.quantity);
          }
          break;

        default:
          throw new BadRequestException(
            `Trạng thái không hợp lệ: ${newStatus}`,
          );
      }

      // Lưu note nội bộ nếu có
      if (input.note) {
        order.addInternalNote(input.note);
      }

      const savedOrder = await this.orderRepository.save(order);
      return Result.ok({ order: savedOrder });
    } catch (error) {
      this.logger.error(`Error updating order status: ${input.orderId}`, error);
      return Result.fail(error);
    }
  }
}
