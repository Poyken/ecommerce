import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  ILoyaltyRepository,
  LOYALTY_REPOSITORY,
} from '../../domain/repositories/loyalty.repository.interface';
import { LOYALTY_CONFIG } from '../../domain/entities/loyalty-config';

export interface GetLoyaltySummaryInput {
  tenantId: string;
  userId: string;
}

export interface GetLoyaltySummaryOutput {
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  expiringSoon: number;
  expiringDate: Date | null;
  pointValue: number;
}

@Injectable()
export class GetLoyaltySummaryUseCase extends QueryUseCase<
  GetLoyaltySummaryInput,
  GetLoyaltySummaryOutput
> {
  constructor(
    @Inject(LOYALTY_REPOSITORY)
    private readonly loyaltyRepository: ILoyaltyRepository,
  ) {
    super();
  }

  async execute(
    input: GetLoyaltySummaryInput,
  ): Promise<Result<GetLoyaltySummaryOutput>> {
    const [balance, summary] = await Promise.all([
        this.loyaltyRepository.sumAmount(input.tenantId, input.userId, { activeOnly: true }),
        this.loyaltyRepository.getSummary(input.tenantId, input.userId),
    ]);

    return Result.ok({
        balance,
        totalEarned: summary.totalEarned,
        totalRedeemed: summary.totalRedeemed,
        expiringSoon: summary.expiringSoon,
        expiringDate: summary.nearestExpiry,
        pointValue: LOYALTY_CONFIG.POINT_VALUE,
    });
  }
}
