import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../domain/repositories/order.repository.interface';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderPlacedEvent } from '../../domain/events/order-placed.event';
import { CheckStockAvailabilityUseCase } from '@/inventory/application/use-cases/check-stock-availability.use-case';

export interface PlaceOrderInput {
  tenantId: string;
  userId: string;
  items: {
    skuId: string;
    quantity: number;
    productId: string;
    skuName: string;
    productName: string;
    price: number;
  }[];
  shipping: {
    recipientName: string;
    phoneNumber: string;
    address: string;
    fee: number;
  };
  paymentMethod: string;
}

export type PlaceOrderOutput = { orderId: string; totalAmount: number };

@Injectable()
export class PlaceOrderUseCase extends CommandUseCase<
  PlaceOrderInput,
  PlaceOrderOutput
> {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly checkStockUseCase: CheckStockAvailabilityUseCase,
  ) {
    super();
  }

  async execute(input: PlaceOrderInput): Promise<Result<PlaceOrderOutput>> {
    // 1. Validate Stock Availability
    const stockResult = await this.checkStockUseCase.execute({
      items: input.items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
    });

    if (stockResult.isSuccess && !stockResult.value.available) {
      return Result.fail(
        new Error(
          `Insufficient stock for: ${stockResult.value.unavailableItems?.join(', ')}`,
        ),
      );
    }

    // 2. Create Order Items (Snapshot data)
    const orderId = uuidv4();
    const items = input.items.map((i) =>
      OrderItem.create({
        id: uuidv4(),
        orderId,
        skuId: i.skuId,
        productId: i.productId,
        skuNameSnapshot: i.skuName,
        productNameSnapshot: i.productName,
        priceAtPurchase: i.price,
        quantity: i.quantity,
        discountAmount: 0,
      }),
    );

    // 3. Create Order Aggregate
    const order = Order.create({
      id: orderId,
      tenantId: input.tenantId,
      userId: input.userId,
      items,
      shippingFee: input.shipping.fee,
      recipientName: input.shipping.recipientName,
      phoneNumber: input.shipping.phoneNumber,
      shippingAddress: input.shipping.address,
      paymentMethod: input.paymentMethod,
    });

    // 4. Persist
    const saved = await this.orderRepository.save(order);

    // 5. Publish Domain Events (OrderPlaced -> Inventory Reservation, Email, etc)
    this.eventEmitter.emit(
      'order.placed',
      new OrderPlacedEvent(
        saved.id,
        saved.tenantId,
        saved.items.map((item) => ({
          skuId: item.skuId,
          quantity: item.quantity,
        })),
        saved.userId,
      ),
    );

    return Result.ok({ orderId: saved.id, totalAmount: saved.totalAmount });
  }
}
