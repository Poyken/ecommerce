import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IPromotionRepository,
  PROMOTION_REPOSITORY,
  PromotionFilter,
} from '../../domain/repositories/promotion.repository.interface';
import { Promotion } from '../../domain/entities/promotion.entity';

export interface ListPromotionsInput extends PromotionFilter {
  tenantId: string;
}

export interface ListPromotionsOutput {
  data: Promotion[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ListPromotionsUseCase extends QueryUseCase<
  ListPromotionsInput,
  ListPromotionsOutput
> {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
  ) {
    super();
  }

  async execute(
    input: ListPromotionsInput,
  ): Promise<Result<ListPromotionsOutput>> {
    const { tenantId, ...filter } = input;
    const { data, total } = await this.promotionRepository.findMany(
      tenantId,
      filter,
    );

    const page = filter.page || 1;
    const limit = filter.limit || 20;

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
