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
import { ValidatePromotionUseCase } from './validate-promotion.use-case';
import { v4 as uuidv4 } from 'uuid';

export interface ApplyPromotionInput {
  tenantId: string;
  code: string;
  orderId: string;
  userId: string;
  totalAmount: number;
  items?: Array<{
    skuId: string;
    quantity: number;
    price: number;
    categoryId?: string;
    productId?: string;
  }>;
  customerGroupId?: string;
}

export type ApplyPromotionOutput = {
  usageId: string;
  promotionId: string;
  discountAmount: number;
};

export type ApplyPromotionError =
  | EntityNotFoundError
  | BusinessRuleViolationError;

@Injectable()
export class ApplyPromotionUseCase extends CommandUseCase<
  ApplyPromotionInput,
  ApplyPromotionOutput,
  ApplyPromotionError
> {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
    private readonly validatePromotionUseCase: ValidatePromotionUseCase,
  ) {
    super();
  }

  async execute(
    input: ApplyPromotionInput,
  ): Promise<Result<ApplyPromotionOutput, ApplyPromotionError>> {
    // 1. Validate first
    const validationResult = await this.validatePromotionUseCase.execute({
      tenantId: input.tenantId,
      code: input.code,
      totalAmount: input.totalAmount,
      userId: input.userId,
      customerGroupId: input.customerGroupId,
      items: input.items,
    });

    if (validationResult.isFailure) {
      return Result.fail(validationResult.error);
    }

    const benefits = validationResult.value;
    const usageId = uuidv4();

    // 2. Save usage (Repository handles atomic increment of usedCount)
    await this.promotionRepository.saveUsage({
      id: usageId,
      promotionId: benefits.promotionId,
      userId: input.userId,
      orderId: input.orderId,
      discountAmount: benefits.discountAmount,
      tenantId: input.tenantId,
    });

    return Result.ok({
      usageId,
      promotionId: benefits.promotionId,
      discountAmount: benefits.discountAmount,
    });
  }
}
