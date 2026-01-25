/**
 * =====================================================================
 * PRISMA ORDER REPOSITORY - Infrastructure Layer (Adapter)
 * =====================================================================
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  IOrderRepository,
  OrderQueryOptions,
} from '../../domain/repositories/order.repository.interface';
import {
  Order,
  OrderProps,
  OrderStatus,
  PaymentStatus,
  OrderItem,
  ShippingAddressSnapshot,
  PaymentInfo,
  ShippingInfo,
} from '../../domain/entities/order.entity';
import {
  PaginatedResult,
  createPaginatedResult,
  calculateSkip,
} from '@core/application/pagination';
import { Money } from '@core/domain/value-objects/money.vo';
import { getTenant } from '@core/tenant/tenant.context';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const data = await (this.prisma.order as any).findUnique({
      where: { id },
      include: this.getOrderIncludes(),
    });
    return data ? this.toDomain(data) : null;
  }

  async findByIdOrFail(id: string): Promise<Order> {
    const order = await this.findById(id);
    if (!order) {
      throw new NotFoundException(`Order not found: ${id}`);
    }
    return order;
  }

  async findByOrderNumber(
    tenantId: string,
    orderNumber: string,
  ): Promise<Order | null> {
    const data = await (this.prisma.order as any).findFirst({
      where: { tenantId, orderNumber },
      include: this.getOrderIncludes(),
    });
    return data ? this.toDomain(data) : null;
  }

  async exists(id: string): Promise<boolean> {
    const count = await (this.prisma.order as any).count({ where: { id } });
    return count > 0;
  }

  async findAll(
    tenantId: string,
    options?: OrderQueryOptions,
  ): Promise<PaginatedResult<Order>> {
    const {
      page = 1,
      limit = 10,
      customerId,
      status,
      fromDate,
      toDate,
      search,
    } = options || {};
    const skip = calculateSkip(page, limit);

    const where: any = { tenantId };

    if (customerId) {
      where.userId = customerId;
    }

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    if (fromDate) {
      where.createdAt = { ...where.createdAt, gte: fromDate };
    }

    if (toDate) {
      where.createdAt = { ...where.createdAt, lte: toDate };
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      (this.prisma.order as any).findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.getOrderIncludes(),
      }),
      (this.prisma.order as any).count({ where }),
    ]);

    const orders = data.map((d: any) => this.toDomain(d));
    return createPaginatedResult(orders, total, page, limit);
  }

  async findByCustomer(
    customerId: string,
    options?: { page?: number; limit?: number },
  ): Promise<PaginatedResult<Order>> {
    const tenant = getTenant();
    return this.findAll(tenant?.id || '', {
      ...options,
      customerId,
      page: options?.page || 1,
      limit: options?.limit || 10,
    });
  }

  async findRecent(tenantId: string, limit = 10): Promise<Order[]> {
    const data = await (this.prisma.order as any).findMany({
      where: { tenantId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: this.getOrderIncludes(),
    });
    return data.map((d: any) => this.toDomain(d));
  }

  async countByStatus(tenantId: string): Promise<Record<OrderStatus, number>> {
    const counts = await (this.prisma.order as any).groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { status: true },
    });

    const result: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.CONFIRMED]: 0,
      [OrderStatus.PROCESSING]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.RETURNED]: 0,
      [OrderStatus.REFUNDED]: 0,
    };

    counts.forEach((c: any) => {
      result[c.status as OrderStatus] = c._count.status;
    });

    return result;
  }

  async generateOrderNumber(tenantId: string): Promise<string> {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Count orders for today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await (this.prisma.order as any).count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `ORD-${datePrefix}-${sequence}`;
  }

  async save(order: Order): Promise<Order> {
    const data = order.toPersistence();
    const tenant = getTenant();

    const existing = await (this.prisma.order as any).findUnique({
      where: { id: order.id },
    });

    let saved;
    if (existing) {
      saved = await (this.prisma.order as any).update({
        where: { id: order.id },
        data: {
          status: data.status,
          subtotal: data.subtotal,
          discount: data.discount,
          shippingCost: data.shippingCost,
          tax: data.tax,
          total: data.total,
          customerNote: data.customerNote,
          internalNote: data.internalNote,
          confirmedAt: data.confirmedAt,
          cancelledAt: data.cancelledAt,
          cancelReason: data.cancelReason,
          updatedAt: new Date(),
        },
        include: this.getOrderIncludes(),
      });
    } else {
      saved = await (this.prisma.order as any).create({
        data: {
          id: data.id,
          tenantId: tenant?.id || data.tenantId,
          orderNumber: data.orderNumber,
          customerId: data.customerId,
          customerEmail: data.customerEmail,
          status: data.status,
          subtotal: data.subtotal,
          discount: data.discount,
          shippingCost: data.shippingCost,
          tax: data.tax,
          total: data.total,
          couponCode: data.couponCode,
          customerNote: data.customerNote,
          internalNote: data.internalNote,
          items: {
            create: order.items.map((item) => ({
              id: item.id,
              skuId: item.skuId,
              productName: item.productNameSnapshot,
              skuCode: item.skuCodeSnapshot,
              variantLabel: item.variantLabelSnapshot,
              price: item.priceAtPurchase.amount,
              imageUrl: item.imageUrlSnapshot,
              quantity: item.quantity,
              subtotal: item.subtotal.amount,
            })),
          },
          shippingAddress: order.shippingAddress as any,
          billingAddress: order.billingAddress as any,
          paymentMethod: order.payment.method,
          paymentStatus: order.payment.status,
        } as any,
        include: this.getOrderIncludes(),
      });
    }

    return this.toDomain(saved);
  }

  async findByIds(ids: string[]): Promise<Order[]> {
    if (ids.length === 0) return [];

    const data = await (this.prisma.order as any).findMany({
      where: { id: { in: ids } },
      include: this.getOrderIncludes(),
    });

    return data.map((d: any) => this.toDomain(d));
  }

  async getStatistics(tenantId: string, fromDate: Date, toDate: Date) {
    const orders = await (this.prisma.order as any).findMany({
      where: {
        tenantId,
        createdAt: { gte: fromDate, lte: toDate },
        status: { not: OrderStatus.CANCELLED },
      },
      select: {
        status: true,
        total: true,
      },
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum: number, o: any) => sum + Number(o.total),
      0,
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByStatus = await this.countByStatus(tenantId);

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue: Math.round(averageOrderValue),
      ordersByStatus,
    };
  }

  // =====================================================================
  // HELPERS
  // =====================================================================

  private getOrderIncludes() {
    return {
      items: true,
      user: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    };
  }

  private toDomain(data: any): Order {
    const items: OrderItem[] = (data.items || []).map((item: any) => ({
      id: item.id,
      skuId: item.skuId,
      productNameSnapshot: item.productName || item.productNameSnapshot,
      skuCodeSnapshot: item.skuCode || item.skuCodeSnapshot,
      variantLabelSnapshot:
        item.variantLabel || item.variantLabelSnapshot || '',
      priceAtPurchase: Money.create(Number(item.price || item.priceAtPurchase)),
      imageUrlSnapshot: item.imageUrl || item.imageUrlSnapshot,
      quantity: item.quantity,
      subtotal: Money.create(
        Number(item.subtotal || item.price * item.quantity),
      ),
    }));

    const shippingAddress: ShippingAddressSnapshot =
      (data.shippingAddress as any) || {
        fullName: data.recipientName || '',
        phone: data.phoneNumber || '',
        addressLine1: data.shippingAddressText || '',
        city: data.shippingCity || '',
        country: 'VN',
      };

    const payment: PaymentInfo = {
      paymentId: data.paymentId,
      method: data.paymentMethod || 'COD',
      status: data.paymentStatus || PaymentStatus.PENDING,
      paidAt: data.paidAt,
      transactionId: data.transactionId,
    };

    const shipping: ShippingInfo = {
      carrier: data.shippingCarrier,
      trackingNumber: data.trackingNumber || data.shippingCode,
      shippedAt: data.shippedAt,
      deliveredAt: data.deliveredAt,
      shippingCost: Money.create(Number(data.shippingFee || 0)),
    };

    const props: OrderProps = {
      id: data.id,
      tenantId: data.tenantId,
      orderNumber: data.orderNumber,
      customerId: data.userId || data.customerId,
      customerEmail: data.customerEmail || data.user?.email || '',
      status: data.status as OrderStatus,
      items,
      subtotal: Money.create(Number(data.subtotal || data.totalAmount)),
      discount: Money.create(Number(data.discount || 0)),
      shippingCost: Money.create(Number(data.shippingFee || 0)),
      tax: Money.create(Number(data.tax || 0)),
      total: Money.create(Number(data.totalAmount || data.total)),
      couponCode: data.couponCode,
      shippingAddress,
      payment,
      shipping,
      customerNote: data.customerNote,
      internalNote: data.internalNote,
      confirmedAt: data.confirmedAt,
      cancelledAt: data.cancelledAt,
      cancelReason: data.cancelReason,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return Order.fromPersistence(props);
  }
}
