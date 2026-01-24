import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  IPromotionRepository,
  PromotionFilter,
} from '../../domain/repositories/promotion.repository.interface';
import { Promotion } from '../../domain/entities/promotion.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaPromotionRepository extends IPromotionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Promotion | null> {
    const data = await this.prisma.promotion.findUnique({
      where: { id },
      include: { rules: true, actions: true },
    });
    return data ? this.toDomain(data) : null;
  }

  async findByCode(tenantId: string, code: string): Promise<Promotion | null> {
    const data = await this.prisma.promotion.findUnique({
      where: {
        tenantId_code: { tenantId, code },
      },
      include: { rules: true, actions: true },
    });
    return data ? this.toDomain(data) : null;
  }

  async findMany(
    tenantId: string,
    filter: PromotionFilter,
  ): Promise<{ data: Promotion[]; total: number }> {
    const { isActive, search, page = 1, limit = 20 } = filter;

    const where: Prisma.PromotionWhereInput = {
      tenantId,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        include: { rules: true, actions: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return {
      data: data.map((d) => this.toDomain(d)),
      total,
    };
  }

  async findActive(tenantId: string): Promise<Promotion[]> {
    const now = new Date();
    const data = await this.prisma.promotion.findMany({
      where: {
        tenantId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { rules: true, actions: true },
      orderBy: { priority: 'desc' },
    });
    return data.map((d) => this.toDomain(d));
  }

  async save(promotion: Promotion): Promise<Promotion> {
    const { rules, actions, ...data } = promotion.toPersistence() as any;

    const saved = await this.prisma.$transaction(async (tx) => {
      // Upsert promotion
      const upserted = await tx.promotion.upsert({
        where: { id: promotion.id },
        create: {
          ...data,
          rules: {
            create: rules.map((r: any) => ({ ...r, tenantId: data.tenantId })),
          },
          actions: {
            create: actions.map((a: any) => ({
              ...a,
              tenantId: data.tenantId,
            })),
          },
        },
        update: {
          ...data,
          rules: {
            deleteMany: {},
            create: rules.map((r: any) => ({ ...r, tenantId: data.tenantId })),
          },
          actions: {
            deleteMany: {},
            create: actions.map((a: any) => ({
              ...a,
              tenantId: data.tenantId,
            })),
          },
        },
        include: { rules: true, actions: true },
      });
      return upserted;
    });

    return this.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.promotion.delete({
      where: { id },
    });
  }

  async countUsage(promotionId: string, userId?: string): Promise<number> {
    return this.prisma.promotionUsage.count({
      where: {
        promotionId,
        ...(userId && { userId }),
      },
    });
  }

  async saveUsage(usage: {
    id: string;
    promotionId: string;
    userId: string;
    orderId: string;
    discountAmount: number;
    tenantId: string;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Create usage
      await tx.promotionUsage.create({
        data: {
          id: usage.id,
          promotionId: usage.promotionId,
          userId: usage.userId,
          orderId: usage.orderId,
          discountAmount: usage.discountAmount,
          tenantId: usage.tenantId,
        },
      });

      // Increment usedCount
      await tx.promotion.update({
        where: { id: usage.promotionId },
        data: { usedCount: { increment: 1 } },
      });
    });
  }

  private toDomain(data: any): Promotion {
    return Promotion.fromPersistence({
      id: data.id,
      tenantId: data.tenantId,
      name: data.name,
      code: data.code || undefined,
      description: data.description || undefined,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
      priority: data.priority,
      usageLimit: data.usageLimit || undefined,
      usedCount: data.usedCount,
      rules: data.rules.map((r: any) => ({
        id: r.id,
        type: r.type,
        operator: r.operator,
        value: r.value,
      })),
      actions: data.actions.map((a: any) => ({
        id: a.id,
        type: a.type,
        value: a.value,
        maxDiscountAmount: a.maxDiscountAmount
          ? Number(a.maxDiscountAmount)
          : undefined,
      })),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
