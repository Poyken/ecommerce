import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderPlacedEvent } from '@/sales/domain/events/order-placed.event';
import { OrderCancelledEvent } from '@/sales/domain/events/order-cancelled.event';
import { PaymentSuccessfulEvent } from '@/sales/payment/domain/events/payment-successful.event';
import { ReserveStockUseCase } from '../use-cases/reserve-stock.use-case';
import { FinalizeStockDeductionUseCase } from '../use-cases/finalize-stock-deduction.use-case';
import { ReleaseStockReservationUseCase } from '../use-cases/release-stock-reservation.use-case';
import { PrismaService } from '@/core/prisma/prisma.service';

@Injectable()
export class OrderEventsHandler {
  private readonly logger = new Logger(OrderEventsHandler.name);

  constructor(
    private readonly reserveStockUseCase: ReserveStockUseCase,
    private readonly finalizeStockDeductionUseCase: FinalizeStockDeductionUseCase,
    private readonly releaseStockReservationUseCase: ReleaseStockReservationUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('order.placed')
  async handleOrderPlaced(event: OrderPlacedEvent) {
    this.logger.log(`Reserving stock for Order: ${event.orderId}`);

    const result = await this.reserveStockUseCase.execute({
      tenantId: event.tenantId,
      orderId: event.orderId,
      items: event.items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
    });

    if (result.isFailure) {
      this.logger.error(
        `Failed to reserve stock for order ${event.orderId}: ${result.error.message}`,
      );
    }
  }

  @OnEvent('payment.successful')
  async handlePaymentSuccessful(event: PaymentSuccessfulEvent) {
    this.logger.log(`Finalizing stock deduction for Order: ${event.orderId}`);

    // We need the items from the order. Since PaymentSuccessfulEvent doesn't have them,
    // we fetch them from the database.
    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId: event.orderId },
    });

    const result = await this.finalizeStockDeductionUseCase.execute({
      tenantId: event.tenantId,
      orderId: event.orderId,
      userId: event.userId,
      items: orderItems.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
    });

    if (result.isFailure) {
      this.logger.error(
        `Failed to finalize stock for order ${event.orderId}: ${result.error.message}`,
      );
    }
  }

  @OnEvent('order.cancelled')
  async handleOrderCancelled(event: OrderCancelledEvent) {
    this.logger.log(`Releasing/Restining stock for Order: ${event.orderId}`);

    // Check if order was already paid (meaning stock was final deducted)
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      select: { paymentStatus: true },
    });

    const wasPaid = order?.paymentStatus === 'PAID';

    const result = await this.releaseStockReservationUseCase.execute({
      tenantId: event.tenantId,
      orderId: event.orderId,
      wasPaid,
      items: event.items.map((i) => ({ skuId: i.skuId, quantity: i.quantity })),
    });

    if (result.isFailure) {
      this.logger.error(
        `Failed to release stock for order ${event.orderId}: ${result.error.message}`,
      );
    }
  }
}
