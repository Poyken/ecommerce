import { Injectable, Inject, Logger } from '@nestjs/common';
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
import { EmailService } from '@/platform/integrations/external/email/email.service';
import { PrismaService } from '@core/prisma/prisma.service';

export interface EarnPointsInput {
  tenantId: string;
  userId?: string;
  amount?: number; // Optional if orderId provided
  orderId?: string;
  reason?: string;
}

export type EarnPointsOutput = { loyaltyPoint: LoyaltyPoint };

@Injectable()
export class EarnPointsUseCase extends CommandUseCase<
  EarnPointsInput,
  EarnPointsOutput
> {
  private readonly logger = new Logger(EarnPointsUseCase.name);

  constructor(
    @Inject(LOYALTY_REPOSITORY)
    private readonly loyaltyRepository: ILoyaltyRepository,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async execute(input: EarnPointsInput): Promise<Result<EarnPointsOutput>> {
    let pointsToEarn = input.amount || 0;
    let reason = input.reason || 'Tích điểm';
    let userId = input.userId;

    // 1. If orderId is provided, handle order-based earning
    if (input.orderId) {
      // Idempotency check
      const existing = await this.loyaltyRepository.findByOrderId(
        input.orderId,
        LoyaltyPointType.EARNED,
      );
      if (existing.length > 0) {
        return Result.ok({ loyaltyPoint: existing[0] });
      }

      const order = await this.prisma.order.findUnique({
        where: { id: input.orderId, tenantId: input.tenantId },
        select: { totalAmount: true, userId: true },
      });

      if (!order)
        return Result.fail(new BusinessRuleViolationError('Order not found'));

      if (!userId) userId = order.userId;

      if (!input.amount) {
        pointsToEarn = Math.floor(
          Number(order.totalAmount) / LOYALTY_CONFIG.POINTS_PER_AMOUNT,
        );
        reason = `Tích điểm từ đơn hàng #${input.orderId.slice(0, 8)}`;
      }
    }

    if (!userId) {
      return Result.fail(new BusinessRuleViolationError('User ID is required'));
    }

    if (pointsToEarn <= 0) {
      return Result.fail(
        new BusinessRuleViolationError('Số điểm tích lũy phải lớn hơn 0'),
      );
    }

    // 2. Create Loyalty Point
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + LOYALTY_CONFIG.EXPIRY_DAYS);

    const point = LoyaltyPoint.create({
      id: uuidv4(),
      tenantId: input.tenantId,
      userId: userId!,
      orderId: input.orderId,
      amount: pointsToEarn,
      type: LoyaltyPointType.EARNED,
      reason,
      expiresAt,
    });

    const saved = await this.loyaltyRepository.save(point);

    // 3. Notify User (Async/Best-effort)
    this.notifyUser(userId!, pointsToEarn, input.orderId).catch((err) =>
      this.logger.error(`Failed to notify user: ${err.message}`),
    );

    return Result.ok({ loyaltyPoint: saved });
  }

  private async notifyUser(userId: string, amount: number, orderId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });

    if (user?.email) {
      await this.emailService.sendLoyaltyPointsEarned(
        user.email,
        user.firstName || 'Quý khách',
        amount,
        orderId || 'MANUAL',
      );
    }
  }
}
