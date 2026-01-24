import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import {
  IPromotionRepository,
  PROMOTION_REPOSITORY,
} from '../../domain/repositories/promotion.repository.interface';
import { Promotion } from '../../domain/entities/promotion.entity';

export interface GetPromotionInput {
  id: string;
  tenantId: string;
}

export type GetPromotionOutput = { promotion: Promotion };

@Injectable()
export class GetPromotionUseCase extends QueryUseCase<
  GetPromotionInput,
  GetPromotionOutput
> {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
  ) {
    super();
  }

  async execute(input: GetPromotionInput): Promise<Result<GetPromotionOutput>> {
    const promotion = await this.promotionRepository.findById(input.id);

    if (!promotion || promotion.tenantId !== input.tenantId) {
      return Result.fail(new EntityNotFoundError('Promotion', input.id));
    }

    return Result.ok({ promotion });
  }
}
