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
import { Promotion } from '../../domain/entities/promotion.entity';
import { PrismaService } from '@core/prisma/prisma.service';

export interface ValidatePromotionInput {
  tenantId: string;
  code: string;
  totalAmount: number;
  userId?: string;
  customerGroupId?: string;
  items?: Array<{
    skuId: string;
    quantity: number;
    price: number;
    categoryId?: string;
    productId?: string;
  }>;
}

export interface ValidatePromotionOutput {
  valid: boolean;
  promotionId: string;
  promotionName: string;
  discountAmount: number;
  freeShipping: boolean;
  giftSkuIds: string[];
}

export type ValidatePromotionError =
  | EntityNotFoundError
  | BusinessRuleViolationError;

@Injectable()
export class ValidatePromotionUseCase extends CommandUseCase<
  ValidatePromotionInput,
  ValidatePromotionOutput,
  ValidatePromotionError
> {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async execute(
    input: ValidatePromotionInput,
  ): Promise<Result<ValidatePromotionOutput, ValidatePromotionError>> {
    const promotion = await this.promotionRepository.findByCode(
      input.tenantId,
      input.code,
    );

    if (!promotion) {
      return Result.fail(new EntityNotFoundError('Promotion', input.code));
    }

    // Prepare context
    let orderCount = 0;
    if (input.userId) {
      orderCount = await this.prisma.order.count({
        where: {
          userId: input.userId,
          tenantId: input.tenantId,
          status: { not: 'CANCELLED' },
        },
      });

      // Check if user already used this promotion
      const userUsage = await this.promotionRepository.countUsage(
        promotion.id,
        input.userId,
      );
      if (userUsage > 0) {
        return Result.fail(
          new BusinessRuleViolationError(
            'Bạn đã sử dụng mã khuyến mãi này rồi',
          ),
        );
      }
    }

    const context = {
      ...input,
      orderCount,
    };

    try {
      // Logic encapsulated in Entity
      promotion.validate(context);
      const benefits = promotion.calculateBenefits(context);

      return Result.ok({
        valid: true,
        promotionId: promotion.id,
        promotionName: promotion.name,
        ...benefits,
      });
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
