import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { ILoyaltyRepository } from '../../domain/repositories/loyalty.repository.interface';
import { LoyaltyPoint, LoyaltyPointType } from '../../domain/entities/loyalty-point.entity';
import { LoyaltyPointType as PrismaLoyaltyPointType } from '@prisma/client';

@Injectable()
export class PrismaLoyaltyRepository extends ILoyaltyRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<LoyaltyPoint | null> {
    const data = await this.prisma.loyaltyPoint.findUnique({ where: { id } });
    return data ? this.toDomain(data) : null;
  }

  async findByOrderId(orderId: string, type?: LoyaltyPointType): Promise<LoyaltyPoint[]> {
    const data = await this.prisma.loyaltyPoint.findMany({
      where: {
        orderId,
        ...(type && { type: type as any }),
      },
    });
    return data.map(d => this.toDomain(d));
  }

  async findByUser(tenantId: string, userId: string, options?: { page?: number; limit?: number }): Promise<{ data: LoyaltyPoint[]; total: number }> {
    const { page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.loyaltyPoint.findMany({
        where: { userId, tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loyaltyPoint.count({ where: { userId, tenantId } }),
    ]);

    return { data: data.map(d => this.toDomain(d)), total };
  }

  async save(point: LoyaltyPoint): Promise<LoyaltyPoint> {
    const data = point.toPersistence() as any;
    const saved = await this.prisma.loyaltyPoint.upsert({
      where: { id: point.id },
      create: data,
      update: data,
    });
    return this.toDomain(saved);
  }

  async sumAmount(tenantId: string, userId: string, filter?: { type?: LoyaltyPointType; activeOnly?: boolean }): Promise<number> {
    const now = new Date();
    const result = await this.prisma.loyaltyPoint.aggregate({
      where: {
        userId,
        tenantId,
        ...(filter?.type && { type: filter.type as any }),
        ...(filter?.activeOnly && {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        }),
      },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }

  async getSummary(tenantId: string, userId: string): Promise<{ totalEarned: number; totalRedeemed: number; expiringSoon: number; nearestExpiry: Date | null; }> {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const [totalEarned, totalRedeemed, expiringSoon, nearest] = await Promise.all([
        this.prisma.loyaltyPoint.aggregate({
            where: { userId, tenantId, type: PrismaLoyaltyPointType.EARNED },
            _sum: { amount: true },
        }),
        this.prisma.loyaltyPoint.aggregate({
            where: { userId, tenantId, type: PrismaLoyaltyPointType.REDEEMED },
            _sum: { amount: true },
        }),
        this.prisma.loyaltyPoint.aggregate({
            where: {
                userId,
                tenantId,
                type: PrismaLoyaltyPointType.EARNED,
                expiresAt: { gt: now, lte: thirtyDaysLater },
            },
            _sum: { amount: true },
        }),
        this.prisma.loyaltyPoint.findFirst({
            where: {
                userId,
                tenantId,
                type: PrismaLoyaltyPointType.EARNED,
                expiresAt: { gt: now },
            },
            orderBy: { expiresAt: 'asc' },
            select: { expiresAt: true },
        }),
    ]);

    return {
        totalEarned: totalEarned._sum.amount || 0,
        totalRedeemed: Math.abs(totalRedeemed._sum.amount || 0),
        expiringSoon: expiringSoon._sum.amount || 0,
        nearestExpiry: nearest?.expiresAt || null,
    };
  }

  async getAdminStats(tenantId: string): Promise<any> {
    // Implement stats logic here...
    return {}; // Placeholder
  }

  private toDomain(data: any): LoyaltyPoint {
    return LoyaltyPoint.fromPersistence({
      id: data.id,
      tenantId: data.tenantId,
      userId: data.userId,
      orderId: data.orderId || undefined,
      amount: data.amount,
      type: data.type as any,
      reason: data.reason || undefined,
      expiresAt: data.expiresAt || undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
