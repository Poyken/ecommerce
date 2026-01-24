import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import {
  IPromotionRepository,
  PROMOTION_REPOSITORY,
} from '../../domain/repositories/promotion.repository.interface';
import { Promotion } from '../../domain/entities/promotion.entity';
import { PrismaService } from '@core/prisma/prisma.service';

export interface GetPromotionStatsInput {
  id: string;
  tenantId: string;
}

export interface GetPromotionStatsOutput {
  promotion: Promotion;
  stats: {
    totalUsages: number;
    totalDiscount: number;
    totalOrderAmount: number;
    remainingUsages: number | 'Không giới hạn';
    averageDiscount: number;
  };
}

@Injectable()
export class GetPromotionStatsUseCase extends QueryUseCase<
  GetPromotionStatsInput,
  GetPromotionStatsOutput
> {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async execute(
    input: GetPromotionStatsInput,
  ): Promise<Result<GetPromotionStatsOutput>> {
    const promotion = await this.promotionRepository.findById(input.id);

    if (!promotion || promotion.tenantId !== input.tenantId) {
      return Result.fail(new EntityNotFoundError('Promotion', input.id));
    }

    const usages = await this.prisma.promotionUsage.findMany({
      where: { promotionId: input.id, tenantId: input.tenantId },
      include: { order: { select: { totalAmount: true } } },
    });

    const totalDiscount = usages.reduce(
      (sum, u) => sum + Number(u.discountAmount),
      0,
    );
    const totalOrderAmount = usages.reduce(
      (sum, u) => sum + Number(u.order.totalAmount),
      0,
    );

    return Result.ok({
      promotion,
      stats: {
        totalUsages: usages.length,
        totalDiscount,
        totalOrderAmount,
        remainingUsages: promotion.usageLimit
          ? promotion.usageLimit - promotion.usedCount
          : 'Không giới hạn',
        averageDiscount: usages.length > 0 ? totalDiscount / usages.length : 0,
      },
    });
  }
}
