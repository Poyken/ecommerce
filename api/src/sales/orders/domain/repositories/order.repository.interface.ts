import { Order } from '../entities/order.entity';

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';

export abstract class IOrderRepository {
  abstract findById(id: string): Promise<Order | null>;
  abstract save(order: Order): Promise<Order>;
  abstract findByUserId(userId: string): Promise<Order[]>;
  abstract findByStatus(status: string): Promise<Order[]>;
  abstract update(id: string, data: Partial<Order>): Promise<Order>;
}
