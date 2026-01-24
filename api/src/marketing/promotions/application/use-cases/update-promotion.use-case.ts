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
import {
  Promotion,
  PromotionRuleProps,
  PromotionActionProps,
} from '../../domain/entities/promotion.entity';
import { v4 as uuidv4 } from 'uuid';

export interface UpdatePromotionInput {
  id: string;
  tenantId: string;
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  priority?: number;
  usageLimit?: number;
  rules?: Omit<PromotionRuleProps, 'id'>[];
  actions?: Omit<PromotionActionProps, 'id'>[];
}

export type UpdatePromotionOutput = { promotion: Promotion };

@Injectable()
export class UpdatePromotionUseCase extends CommandUseCase<
  UpdatePromotionInput,
  UpdatePromotionOutput
> {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
  ) {
    super();
  }

  async execute(
    input: UpdatePromotionInput,
  ): Promise<Result<UpdatePromotionOutput>> {
    const promotion = await this.promotionRepository.findById(input.id);

    if (!promotion || promotion.tenantId !== input.tenantId) {
      return Result.fail(new EntityNotFoundError('Promotion', input.id));
    }

    // Logic for updating the promotion
    // In a complex aggregate, we might have specific domain methods
    // For simplicity, I'll allow partial updates to Props

    const updatedProps = {
      ...promotion.toPersistence(),
      ...input,
      rules: input.rules
        ? input.rules.map((r) => ({ ...r, id: uuidv4() }))
        : (promotion as any).rules,
      actions: input.actions
        ? input.actions.map((a) => ({ ...a, id: uuidv4() }))
        : (promotion as any).actions,
    } as any;

    const updatedPromotion = Promotion.fromPersistence(updatedProps);
    const saved = await this.promotionRepository.save(updatedPromotion);

    return Result.ok({ promotion: saved });
  }
}
