import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import {
  OrderStatus,
  PaymentStatus,
} from '../../domain/enums/order-status.enum';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const data = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return data ? this.toDomain(data) : null;
  }

  async save(order: Order): Promise<Order> {
    const data = order.toPersistence() as any;
    const { items, ...orderData } = data;

    // Use transaction to update order and items
    // This is simple implementation (delete all items and recreate is inefficient but safe for MVP)
    // Better way: diff items. But OrderItems are value objects part of Aggregate, so usually replaced.
    // However, recreating them changes IDs if they are generated.
    // For now, let's assume update only updates Order fields, and Create creates everything.

    const saved = await this.prisma.$transaction(async (tx) => {
      // Upsert Order
      const savedOrder = await tx.order.upsert({
        where: { id: order.id },
        create: {
          ...orderData,
          items: {
            create: items.map((item: any) => ({
              id: item.id,
              skuId: item.skuId,
              productId: item.productId,
              skuNameSnapshot: item.skuNameSnapshot,
              productNameSnapshot: item.productNameSnapshot,
              priceAtPurchase: item.priceAtPurchase,
              quantity: item.quantity,
              discountAmount: item.discountAmount,
            })),
          },
        },
        update: orderData,
      });

      return savedOrder;
    });

    // If update, we might need to handle items if they changed.
    // Domain Events usually handle side effects.
    // For now, assume items don't change after placement in this simplified version.

    // Reload with items
    const reloaded = await this.prisma.order.findUnique({
      where: { id: saved.id },
      include: { items: true },
    });

    return this.toDomain(reloaded);
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const data = await this.prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d) => this.toDomain(d));
  }

  async findByStatus(status: string): Promise<Order[]> {
    const data = await this.prisma.order.findMany({
      where: { status: status as any },
      include: { items: true },
    });
    return data.map((d) => this.toDomain(d));
  }

  private toDomain(data: any): Order {
    const items = data.items.map((item: any) =>
      OrderItem.fromPersistence({
        id: item.id,
        orderId: item.orderId,
        skuId: item.skuId,
        productId: item.productId,
        skuNameSnapshot: item.skuNameSnapshot,
        productNameSnapshot: item.productNameSnapshot,
        priceAtPurchase: Number(item.priceAtPurchase),
        quantity: item.quantity,
        discountAmount: Number(item.discountAmount),
        finalPrice:
          Number(item.priceAtPurchase) * item.quantity -
          Number(item.discountAmount),
      }),
    );

    return Order.fromPersistence({
      id: data.id,
      tenantId: data.tenantId,
      userId: data.userId,
      status: data.status as OrderStatus,
      totalAmount: Number(data.totalAmount),
      shippingFee: Number(data.shippingFee),
      recipientName: data.recipientName,
      phoneNumber: data.phoneNumber,
      shippingAddress: data.shippingAddress || '',
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus as PaymentStatus,
      items,
      orderDate: data.orderDate,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      deletedAt: data.deletedAt,
    });
  }
  async update(id: string, data: Partial<Order>): Promise<Order> {
    const updated = await this.prisma.order.update({
      where: { id },
      data: data as any,
      include: { items: true },
    });
    return this.toDomain(updated);
  }
}
