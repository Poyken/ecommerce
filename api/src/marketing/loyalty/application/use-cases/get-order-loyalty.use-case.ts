import { Injectable, Inject, Logger } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  ILoyaltyRepository,
  LOYALTY_REPOSITORY,
} from '../../domain/repositories/loyalty.repository.interface';
import { LoyaltyPoint } from '../../domain/entities/loyalty-point.entity';

export interface GetOrderLoyaltyInput {
  tenantId: string;
  orderId: string;
}

@Injectable()
export class GetOrderLoyaltyUseCase extends QueryUseCase<
  GetOrderLoyaltyInput,
  LoyaltyPoint[]
> {
  private readonly logger = new Logger(GetOrderLoyaltyUseCase.name);

  constructor(
    @Inject(LOYALTY_REPOSITORY)
    private readonly loyaltyRepository: ILoyaltyRepository,
  ) {
    super();
  }

  async execute(input: GetOrderLoyaltyInput): Promise<Result<LoyaltyPoint[]>> {
    try {
      const points = await this.loyaltyRepository.findByOrderId(input.orderId);
      return Result.ok(points);
    } catch (error) {
      this.logger.error(`Failed to get order points: ${error.message}`);
      return Result.fail(error);
    }
  }
}
