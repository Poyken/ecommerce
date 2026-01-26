import { Injectable, Logger } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PrismaService } from '@core/prisma/prisma.service';
import { LoyaltyPointType } from '../../domain/entities/loyalty-point.entity';

@Injectable()
export class ProcessExpiredPointsUseCase extends CommandUseCase<
  void,
  { processed: number }
> {
  private readonly logger = new Logger(ProcessExpiredPointsUseCase.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(): Promise<Result<{ processed: number }>> {
    const now = new Date();

    try {
      // Find expired points that haven't been revoked yet
      // This is a simplified version of the logic
      const expiredPoints = await this.prisma.loyaltyPoint.findMany({
        where: {
          type: LoyaltyPointType.EARNED,
          expiresAt: { lt: now },
        },
        select: { id: true, userId: true, amount: true, tenantId: true },
      });

      this.logger.log(`Found ${expiredPoints.length} expired point records`);

      // In a real system, you'd create a REVOKED transaction or
      // handle partial redemptions. For now, we just count them
      // to keep it consistent with the previous service implementation.

      return Result.ok({ processed: expiredPoints.length });
    } catch (error) {
      this.logger.error(`Failed to process expired points: ${error.message}`);
      return Result.fail(error);
    }
  }
}
