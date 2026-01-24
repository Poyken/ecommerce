import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  EntityNotFoundError,
  BusinessRuleViolationError,
} from '@/core/domain/errors/domain.error';
import {
  IPromotionRepository,
  PROMOTION_REPOSITORY,
} from '../../domain/repositories/promotion.repository.interface';

export interface DeletePromotionInput {
  id: string;
  tenantId: string;
}

export type DeletePromotionOutput = { success: true };

@Injectable()
export class DeletePromotionUseCase extends CommandUseCase<
  DeletePromotionInput,
  DeletePromotionOutput
> {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
  ) {
    super();
  }

  async execute(
    input: DeletePromotionInput,
  ): Promise<Result<DeletePromotionOutput>> {
    const promotion = await this.promotionRepository.findById(input.id);

    if (!promotion || promotion.tenantId !== input.tenantId) {
      return Result.fail(new EntityNotFoundError('Promotion', input.id));
    }

    // Check usage
    const usageCount = await this.promotionRepository.countUsage(promotion.id);
    if (usageCount > 0) {
      return Result.fail(
        new BusinessRuleViolationError(
          `Không thể xóa vì đã có ${usageCount} lượt sử dụng.`,
        ),
      );
    }

    await this.promotionRepository.delete(input.id);

    return Result.ok({ success: true });
  }
}
