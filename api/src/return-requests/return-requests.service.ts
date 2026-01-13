import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnRequestDto } from './dto/update-return-request.dto';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class ReturnRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, tenantId: string, dto: CreateReturnRequestDto) {
    // 1. Verify Order belongs to User & Tenant
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order || order.userId !== userId || order.tenantId !== tenantId) {
      throw new NotFoundException('Order not found or access denied');
    }

    // 2. Validate Items exist in Order
    for (const item of dto.items) {
      const orderItem = order.items.find((i) => i.id === item.orderItemId);
      if (!orderItem) {
        throw new BadRequestException(
          `OrderItem ${item.orderItemId} invalid for this order`,
        );
      }
      if (item.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `Quantity ${item.quantity} exceeds purchased amount`,
        );
      }
      // TODO: Check if already returned?
    }

    // 3. Create Return Request
    return this.prisma.returnRequest.create({
      data: {
        userId,
        tenantId,
        orderId: dto.orderId,
        reason: dto.reason,
        description: dto.description,
        type: dto.type as any,
        returnMethod: dto.returnMethod as any,
        pickupAddress: dto.pickupAddress,
        refundMethod: dto.refundMethod as any,
        refundAmount: dto.refundAmount,
        bankAccount: dto.bankAccount as any,
        images: dto.images,
        status: 'PENDING',
        items: {
          create: dto.items.map((i) => ({
            orderItemId: i.orderItemId,
            quantity: i.quantity,
          })),
        },
      },
    });
  }

  async findAllByUser(userId: string, tenantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where: { userId, tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.returnRequest.count({ where: { userId, tenantId } }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findAll(tenantId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true } },
          order: { select: { id: true, totalAmount: true } },
        },
      }),
      this.prisma.returnRequest.count({ where: { tenantId } }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string, tenantId: string) {
    const request = await this.prisma.returnRequest.findFirst({
      where: { id, tenantId },
      include: {
        items: { include: { orderItem: true } },
        order: true,
        user: true,
      },
    });
    if (!request) throw new NotFoundException('Return Request not found');
    return request;
  }

  async update(id: string, dto: UpdateReturnRequestDto, tenantId: string) {
    // Admin update logic (status, inspection result)
    const { status, inspectionNotes, rejectedReason } = dto;

    return this.prisma.returnRequest.update({
      where: { id, tenantId },
      data: {
        status: status as any, // Cast to any to avoid temporary lint error until client refresh
        inspectionNotes,
        rejectedReason,
      },
    });
  }

  async updateTracking(
    id: string,
    userId: string,
    trackingCode: string,
    carrier: string,
  ) {
    const request = await this.prisma.returnRequest.findFirst({
      where: { id, userId },
    });
    if (!request) throw new NotFoundException('Request not found');

    if (request.status !== 'APPROVED') {
      throw new BadRequestException('Request must be APPROVED to add tracking');
    }

    return this.prisma.returnRequest.update({
      where: { id },
      data: {
        trackingCode,
        carrier,
        status: 'IN_TRANSIT', // Update status automatically
      },
    });
  }
}
