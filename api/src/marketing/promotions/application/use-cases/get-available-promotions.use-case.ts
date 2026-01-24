import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IPromotionRepository,
  PROMOTION_REPOSITORY,
} from '../../domain/repositories/promotion.repository.interface';
import {
  Promotion,
  PromotionRuleType,
} from '../../domain/entities/promotion.entity';

export interface GetAvailablePromotionsInput {
  tenantId: string;
  totalAmount?: number;
  userId?: string;
}

export type GetAvailablePromotionsOutput = { promotions: Promotion[] };

@Injectable()
export class GetAvailablePromotionsUseCase extends QueryUseCase<
  GetAvailablePromotionsInput,
  GetAvailablePromotionsOutput
> {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
  ) {
    super();
  }

  async execute(
    input: GetAvailablePromotionsInput,
  ): Promise<Result<GetAvailablePromotionsOutput>> {
    let promotions = await this.promotionRepository.findActive(input.tenantId);

    // Filter by usage limit
    promotions = promotions.filter(
      (p) => p.usageLimit === undefined || p.usedCount < p.usageLimit,
    );

    // Filter by context if provided
    if (input.totalAmount) {
      promotions = promotions.filter((p) => {
        const minOrderRule = p.rules.find(
          (r) => r.type === PromotionRuleType.MIN_ORDER_VALUE,
        );
        if (minOrderRule) {
          const minAmount = parseFloat(minOrderRule.value);
          if (input.totalAmount! < minAmount) return false;
        }
        return true;
      });
    }

    return Result.ok({ promotions });
  }
}
