import { OrderStatus } from '../enums/order-status.enum';

export class OrderStatusUpdatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly oldStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
    public readonly reason?: string,
  ) {}
}
