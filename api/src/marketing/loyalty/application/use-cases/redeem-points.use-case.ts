import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { BusinessRuleViolationError } from '@/core/domain/errors/domain.error';
import {
  ILoyaltyRepository,
  LOYALTY_REPOSITORY,
} from '../../domain/repositories/loyalty.repository.interface';
import {
  LoyaltyPoint,
  LoyaltyPointType,
} from '../../domain/entities/loyalty-point.entity';
import { LOYALTY_CONFIG } from '../../domain/entities/loyalty-config';
import { v4 as uuidv4 } from 'uuid';

export interface RedeemPointsInput {
  tenantId: string;
  userId: string;
  amount: number;
  orderId?: string;
  orderTotal?: number;
  reason?: string;
}

export type RedeemPointsOutput = {
  loyaltyPoint: LoyaltyPoint;
  discountAmount: number;
};

@Injectable()
export class RedeemPointsUseCase extends CommandUseCase<
  RedeemPointsInput,
  RedeemPointsOutput
> {
  constructor(
    @Inject(LOYALTY_REPOSITORY)
    private readonly loyaltyRepository: ILoyaltyRepository,
  ) {
    super();
  }

  async execute(input: RedeemPointsInput): Promise<Result<RedeemPointsOutput>> {
    const { tenantId, userId, amount, orderId, orderTotal, reason } = input;

    if (amount <= 0) {
      return Result.fail(
        new BusinessRuleViolationError('Số điểm muốn tiêu phải lớn hơn 0'),
      );
    }

    if (amount < LOYALTY_CONFIG.MIN_REDEEM_POINTS) {
      return Result.fail(
        new BusinessRuleViolationError(
          `Tối thiểu ${LOYALTY_CONFIG.MIN_REDEEM_POINTS} điểm mới được sử dụng`,
        ),
      );
    }

    // 1. Check Balance
    const balance = await this.loyaltyRepository.sumAmount(tenantId, userId, {
      activeOnly: true,
    });
    if (balance < amount) {
      return Result.fail(
        new BusinessRuleViolationError(
          `Số dư điểm không đủ. Hiện có: ${balance}`,
        ),
      );
    }

    // 2. Check Order Max %
    if (orderTotal) {
      const maxRedeemValue =
        (orderTotal * LOYALTY_CONFIG.MAX_REDEEM_PERCENT) / 100;
      const calculatedRedeemValue = amount * LOYALTY_CONFIG.POINT_VALUE;

      if (calculatedRedeemValue > maxRedeemValue) {
        const maxPoints = Math.floor(
          maxRedeemValue / LOYALTY_CONFIG.POINT_VALUE,
        );
        return Result.fail(
          new BusinessRuleViolationError(
            `Tối đa chỉ được dùng ${maxPoints} điểm (${LOYALTY_CONFIG.MAX_REDEEM_PERCENT}% giá trị đơn hàng)`,
          ),
        );
      }
    }

    // 3. Create Redeemed point (Negative amount)
    const point = LoyaltyPoint.create({
      id: uuidv4(),
      tenantId,
      userId,
      orderId,
      amount: -amount,
      type: LoyaltyPointType.REDEEMED,
      reason:
        reason ||
        (orderId ? `Đổi điểm cho đơn #${orderId.slice(0, 8)}` : 'Tiêu điểm'),
    });

    const saved = await this.loyaltyRepository.save(point);

    return Result.ok({
      loyaltyPoint: saved,
      discountAmount: amount * LOYALTY_CONFIG.POINT_VALUE,
    });
  }
}
