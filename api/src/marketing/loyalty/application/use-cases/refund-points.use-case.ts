import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  ILoyaltyRepository,
  LOYALTY_REPOSITORY,
} from '../../domain/repositories/loyalty.repository.interface';
import { LoyaltyPoint, LoyaltyPointType } from '../../domain/entities/loyalty-point.entity';
import { v4 as uuidv4 } from 'uuid';

export interface RefundPointsInput {
  tenantId: string;
  userId: string;
  orderId: string;
  amount?: number;
  reason?: string;
}

export type RefundPointsOutput = { loyaltyPoint: LoyaltyPoint | null };

@Injectable()
export class RefundPointsUseCase extends CommandUseCase<
  RefundPointsInput,
  RefundPointsOutput
> {
  constructor(
    @Inject(LOYALTY_REPOSITORY)
    private readonly loyaltyRepository: ILoyaltyRepository,
  ) {
    super();
  }

  async execute(
    input: RefundPointsInput,
  ): Promise<Result<RefundPointsOutput>> {
    const { tenantId, userId, orderId, amount, reason } = input;

    // 1. Check if order had redeemed points
    const redemptions = await this.loyaltyRepository.findByOrderId(orderId, LoyaltyPointType.REDEEMED);
    if (redemptions.length === 0) {
        return Result.ok({ loyaltyPoint: null }); // No redemption to refund
    }

    // 2. Check if already refunded
    const refunds = await this.loyaltyRepository.findByOrderId(orderId, LoyaltyPointType.REFUNDED);
    if (refunds.length > 0) {
        return Result.ok({ loyaltyPoint: refunds[0] });
    }

    // 3. Create Refund
    const totalRedeemed = Math.abs(redemptions.reduce((sum, r) => sum + r.amount, 0));
    const pointsToRefund = amount || totalRedeemed;

    const point = LoyaltyPoint.create({
        id: uuidv4(),
        tenantId,
        userId,
        orderId,
        amount: pointsToRefund,
        type: LoyaltyPointType.REFUNDED,
        reason: reason || `Hoàn điểm cho đơn #${orderId.slice(0, 8)}`,
    });

    const saved = await this.loyaltyRepository.save(point);

    return Result.ok({ loyaltyPoint: saved });
  }
}
