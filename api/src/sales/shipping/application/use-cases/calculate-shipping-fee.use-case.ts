import { Injectable, Logger } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { GHNService } from '../../ghn.service';

export interface CalculateShippingFeeInput {
  toDistrictId: number;
  toWardCode: string;
  weight?: number;
  height?: number;
  length?: number;
  width?: number;
}

@Injectable()
export class CalculateShippingFeeUseCase extends QueryUseCase<
  CalculateShippingFeeInput,
  number
> {
  private readonly logger = new Logger(CalculateShippingFeeUseCase.name);

  constructor(private readonly ghnService: GHNService) {
    super();
  }

  async execute(input: CalculateShippingFeeInput): Promise<Result<number>> {
    try {
      const fee = await this.ghnService.calculateFee({
        to_district_id: input.toDistrictId,
        to_ward_code: input.toWardCode,
        weight: input.weight || 1000,
        height: input.height || 10,
        length: input.length || 10,
        width: input.width || 10,
      });
      return Result.ok(fee);
    } catch (error) {
      this.logger.error(`Failed to calculate shipping fee: ${error.message}`);
      // Fallback value already handled by ghnService circuit breaker,
      // but we wrap it in Result for consistency.
      return Result.ok(30000); // UI fallback
    }
  }
}
