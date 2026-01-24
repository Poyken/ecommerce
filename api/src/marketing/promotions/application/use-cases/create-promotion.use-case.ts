import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { BusinessRuleViolationError } from '@/core/domain/errors/domain.error';
import {
  IPromotionRepository,
  PROMOTION_REPOSITORY,
} from '../../domain/repositories/promotion.repository.interface';
import {
  Promotion,
  PromotionRuleProps,
  PromotionActionProps,
} from '../../domain/entities/promotion.entity';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePromotionInput {
  tenantId: string;
  name: string;
  code?: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
  priority?: number;
  usageLimit?: number;
  rules: Omit<PromotionRuleProps, 'id'>[];
  actions: Omit<PromotionActionProps, 'id'>[];
}

export type CreatePromotionOutput = { promotion: Promotion };

@Injectable()
export class CreatePromotionUseCase extends CommandUseCase<
  CreatePromotionInput,
  CreatePromotionOutput
> {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
  ) {
    super();
  }

  async execute(
    input: CreatePromotionInput,
  ): Promise<Result<CreatePromotionOutput>> {
    // Check if code exists
    if (input.code) {
      const existing = await this.promotionRepository.findByCode(
        input.tenantId,
        input.code,
      );
      if (existing) {
        return Result.fail(
          new BusinessRuleViolationError('Mã khuyến mãi đã tồn tại'),
        );
      }
    }

    const promotion = Promotion.create({
      id: uuidv4(),
      ...input,
      rules: input.rules.map((r) => ({ ...r, id: uuidv4() })),
      actions: input.actions.map((a) => ({ ...a, id: uuidv4() })),
    });

    const saved = await this.promotionRepository.save(promotion);

    return Result.ok({ promotion: saved });
  }
}
