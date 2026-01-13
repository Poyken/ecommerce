import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { ShipmentStatus, OrderStatus } from '@prisma/client';
import {
  CreateShipmentDto,
  UpdateShipmentStatusDto,
} from './dto/fulfillment.dto';

@Injectable()
export class FulfillmentService {
  constructor(private readonly prisma: PrismaService) {}

  async createShipment(tenantId: string, dto: CreateShipmentDto) {
    const { orderId, items, carrier, trackingCode } = dto;

    // 1. Kiểm tra đơn hàng tồn tại
    const order = (await this.prisma.order.findUnique({
      where: { id: orderId, tenantId },
      include: { items: true, shipments: { include: { items: true } } },
    })) as any;

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 2. Validate Items và tính toán số lượng còn lại (Remaining Quantity)
    const shipmentItemsData: { orderItemId: string; quantity: number }[] = [];

    for (const itemDto of items) {
      const orderItem = order.items.find((oi) => oi.id === itemDto.orderItemId);
      if (!orderItem) {
        throw new BadRequestException(
          `Order item ${itemDto.orderItemId} not found in this order`,
        );
      }

      // Tính tổng số lượng đã giao của item này trong các shipment trước
      const alreadyShippedQuantity = order.shipments.reduce((acc, shipment) => {
        const matchingItem = shipment.items.find(
          (si) => si.orderItemId === itemDto.orderItemId,
        );
        return acc + (matchingItem ? matchingItem.quantity : 0);
      }, 0);

      const remainingQuantity = orderItem.quantity - alreadyShippedQuantity;

      if (itemDto.quantity > remainingQuantity) {
        throw new BadRequestException(
          `Quantity ${itemDto.quantity} exceeds remaining quantity ${remainingQuantity} for item ${orderItem.skuId}`,
        );
      }

      shipmentItemsData.push({
        orderItemId: itemDto.orderItemId,
        quantity: itemDto.quantity,
      });
    }

    // 3. Tạo Shipment trong Transaction
    return this.prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          orderId,
          tenantId,
          carrier,
          trackingCode,
          status: ShipmentStatus.PENDING,
          items: {
            create: shipmentItemsData,
          },
        },
        include: { items: true },
      });

      // Nếu đây là lần giao hàng đầu tiên, có thể cập nhật trạng thái đơn hàng sang PROCESSING
      if (order.status === OrderStatus.PENDING) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PROCESSING },
        });
      }

      return shipment;
    });
  }

  async updateShipmentStatus(
    tenantId: string,
    id: string,
    dto: UpdateShipmentStatusDto,
  ) {
    const shipment = (await this.prisma.shipment.findUnique({
      where: { id, tenantId },
      include: {
        order: {
          include: { items: true, shipments: { include: { items: true } } },
        },
      },
    })) as any;

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: { id },
        data: {
          status: dto.status,
          shippedAt:
            dto.status === ShipmentStatus.SHIPPED ? new Date() : undefined,
          deliveredAt:
            dto.status === ShipmentStatus.DELIVERED ? new Date() : undefined,
        },
      });

      // Nếu status là DELIVERED, kiểm tra xem toàn bộ Order đã hoàn thành chưa
      if (dto.status === ShipmentStatus.DELIVERED) {
        const order = shipment.order;

        // Tính định mức: Tổng số lượng items trong đơn hàng
        const totalOrderedQuantity = order.items.reduce(
          (acc, item) => acc + item.quantity,
          0,
        );

        // Tính tổng số lượng thực tế đã giao thành công (bao gồm cả shipment hiện tại)
        const allShipments = await tx.shipment.findMany({
          where: { orderId: order.id, status: ShipmentStatus.DELIVERED },
          include: { items: true },
        });

        const totalDeliveredQuantity = allShipments.reduce((acc, s) => {
          return acc + s.items.reduce((sum, item) => sum + item.quantity, 0);
        }, 0);

        if (totalDeliveredQuantity >= totalOrderedQuantity) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.COMPLETED },
          });
        }
      }

      return updatedShipment;
    });
  }

  async getShipments(tenantId: string, orderId?: string) {
    return this.prisma.shipment.findMany({
      where: {
        tenantId,
        orderId: orderId ? orderId : undefined,
      },
      include: { items: true, order: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getShipmentById(tenantId: string, id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id, tenantId },
      include: { items: true, order: true },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    return shipment;
  }
}
