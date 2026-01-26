import { Injectable, Inject, Logger } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PrismaService } from '@core/prisma/prisma.service';
import { LOYALTY_CONFIG } from '../../domain/entities/loyalty-config';
import { LoyaltyPointType } from '../../domain/entities/loyalty-point.entity';

export interface GetLoyaltyStatsInput {
  tenantId: string;
}

export interface LoyaltyStatsOutput {
  totalEarned: number;
  totalRedeemed: number;
  activeMembers: number;
  expiringThisMonth: number;
  pointValue: number;
  conversionRate: number;
}

@Injectable()
export class GetLoyaltyStatsUseCase extends QueryUseCase<
  GetLoyaltyStatsInput,
  LoyaltyStatsOutput
> {
  private readonly logger = new Logger(GetLoyaltyStatsUseCase.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    input: GetLoyaltyStatsInput,
  ): Promise<Result<LoyaltyStatsOutput>> {
    const { tenantId } = input;
    const now = new Date();

    try {
      const [totalEarned, totalRedeemed, activeUsers, expiringThisMonth] =
        await Promise.all([
          this.prisma.loyaltyPoint.aggregate({
            where: { tenantId, type: LoyaltyPointType.EARNED },
            _sum: { amount: true },
          }),
          this.prisma.loyaltyPoint.aggregate({
            where: { tenantId, type: LoyaltyPointType.REDEEMED },
            _sum: { amount: true },
          }),
          this.prisma.loyaltyPoint.groupBy({
            by: ['userId'],
            where: { tenantId },
            _sum: { amount: true },
            having: { amount: { _sum: { gt: 0 } } },
          }),
          this.prisma.loyaltyPoint.aggregate({
            where: {
              tenantId,
              type: LoyaltyPointType.EARNED,
              expiresAt: {
                gt: now,
                lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
              },
            },
            _sum: { amount: true },
          }),
        ]);

      return Result.ok({
        totalEarned: totalEarned._sum.amount || 0,
        totalRedeemed: Math.abs(totalRedeemed._sum.amount || 0),
        activeMembers: activeUsers.length,
        expiringThisMonth: expiringThisMonth._sum.amount || 0,
        pointValue: LOYALTY_CONFIG.POINT_VALUE,
        conversionRate: LOYALTY_CONFIG.POINTS_PER_AMOUNT,
      });
    } catch (error) {
      this.logger.error(`Failed to get loyalty stats: ${error.message}`);
      return Result.fail(error);
    }
  }
}
