import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { IShipmentRepository } from '../../domain/repositories/shipment.repository.interface';
import { Shipment } from '../../domain/entities/shipment.entity';

@Injectable()
export class PrismaShipmentRepository extends IShipmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Shipment | null> {
    const data = await this.prisma.shipment.findUnique({
      where: { id },
      include: { items: true },
    });
    return data ? this.toDomain(data) : null;
  }

  async findByOrderId(orderId: string): Promise<Shipment[]> {
    const dataArray = await this.prisma.shipment.findMany({
      where: { orderId },
      include: { items: true },
    });
    return dataArray.map((data) => this.toDomain(data));
  }

  async findByTrackingCode(trackingCode: string): Promise<Shipment | null> {
    const data = await this.prisma.shipment.findFirst({
      where: { trackingCode },
      include: { items: true },
    });
    return data ? this.toDomain(data) : null;
  }

  async save(shipment: Shipment): Promise<Shipment> {
    const { items, ...data } = shipment.toPersistence() as any;

    const saved = await this.prisma.$transaction(async (tx) => {
      const upserted = await tx.shipment.upsert({
        where: { id: shipment.id },
        create: {
          ...data,
          items: {
            create: items.map((item: any) => ({
              orderItemId: item.orderItemId,
              quantity: item.quantity,
            })),
          },
        },
        update: {
          ...data,
          items: {
            deleteMany: {},
            create: items.map((item: any) => ({
              orderItemId: item.orderItemId,
              quantity: item.quantity,
            })),
          },
        },
        include: { items: true },
      });
      return upserted;
    });

    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.shipment.delete({
      where: { id },
    });
  }

  private toDomain(data: any): Shipment {
    return Shipment.fromPersistence({
      id: data.id,
      tenantId: data.tenantId,
      orderId: data.orderId,
      status: data.status as any,
      carrier: data.carrier || undefined,
      trackingCode: data.trackingCode || undefined,
      shippedAt: data.shippedAt || undefined,
      deliveredAt: data.deliveredAt || undefined,
      items: data.items.map((i: any) => ({
        id: i.id,
        orderItemId: i.orderItemId,
        quantity: i.quantity,
      })),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
