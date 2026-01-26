import { Injectable, Logger } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PrismaService } from '@core/prisma/prisma.service';

export interface GrantWelcomeVoucherInput {
  tenantId: string;
  userId: string;
}

export interface GrantWelcomeVoucherOutput {
  userId: string;
  type: string;
  title: string;
  message: string;
}

@Injectable()
export class GrantWelcomeVoucherUseCase extends CommandUseCase<
  GrantWelcomeVoucherInput,
  GrantWelcomeVoucherOutput
> {
  private readonly logger = new Logger(GrantWelcomeVoucherUseCase.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    input: GrantWelcomeVoucherInput,
  ): Promise<Result<GrantWelcomeVoucherOutput>> {
    const { tenantId, userId } = input;

    try {
      // Check if user already received welcome gift (spam protection)
      const existingNotification = await (
        this.prisma.notification as any
      ).findFirst({
        where: {
          userId,
          tenantId,
          title: { contains: 'Quà tặng chào mừng' },
        },
      });

      if (existingNotification) {
        this.logger.log(
          `User ${userId} already received welcome gift. Skipping.`,
        );
        // We return success but with a flag or handled differently if needed.
        // For now, mirroring the service logic which returns null.
        // In UseCase, we return a failed result or a success with empty data.
        // Let's return success with info that it was skipped if we want to be explicit,
        // but here let's just match the service's "don't do anything else" vibe.
        return Result.fail(new Error('User already received welcome gift'));
      }

      // In real scenario, you'd create a unique Promotion or record a special attribute.
      // For now, mirroring the service which only provides notification data
      // and relies on FIRST_ORDER rule in the engine.

      this.logger.log(`Recording welcome gift for User ${userId}`);

      return Result.ok({
        userId,
        type: 'WELCOME_GIFT',
        title: 'Quà tặng chào mừng thành viên mới! 🎁',
        message:
          'Chào mừng bạn! Bạn sẽ nhận được ưu đãi giảm giá cho đơn hàng đầu tiên.',
      });
    } catch (error) {
      this.logger.error(`Failed to grant welcome voucher: ${error.message}`);
      return Result.fail(error);
    }
  }
}
