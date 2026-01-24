import { OrderStatus } from '@prisma/client';

export class OrderStatusUpdatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly oldStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
    public readonly tenantId: string,
    public readonly metadata?: any,
  ) {}
}
