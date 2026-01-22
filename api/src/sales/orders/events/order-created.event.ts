import { OrderStatus } from '@prisma/client';

export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly totalAmount: number,
    public readonly paymentMethod: string,
    public readonly tenantId: string,
    public readonly metadata?: any,
  ) {}
}
