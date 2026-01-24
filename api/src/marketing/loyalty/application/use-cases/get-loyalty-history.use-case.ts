import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  ILoyaltyRepository,
  LOYALTY_REPOSITORY,
} from '../../domain/repositories/loyalty.repository.interface';
import { LoyaltyPoint } from '../../domain/entities/loyalty-point.entity';

export interface GetLoyaltyHistoryInput {
  tenantId: string;
  userId: string;
  page?: number;
  limit?: number;
}

export interface GetLoyaltyHistoryOutput {
  data: LoyaltyPoint[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class GetLoyaltyHistoryUseCase extends QueryUseCase<
  GetLoyaltyHistoryInput,
  GetLoyaltyHistoryOutput
> {
  constructor(
    @Inject(LOYALTY_REPOSITORY)
    private readonly loyaltyRepository: ILoyaltyRepository,
  ) {
    super();
  }

  async execute(
    input: GetLoyaltyHistoryInput,
  ): Promise<Result<GetLoyaltyHistoryOutput>> {
    const { tenantId, userId, page = 1, limit = 20 } = input;
    const { data, total } = await this.loyaltyRepository.findByUser(tenantId, userId, { page, limit });

    return Result.ok({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
}
