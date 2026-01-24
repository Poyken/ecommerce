import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PrismaService } from '@core/prisma/prisma.service';
import { BusinessRuleViolationError } from '@/core/domain/errors/domain.error';

export interface CheckStockInput {
  items: Array<{
    skuId: string;
    quantity: number;
  }>;
}

export interface CheckStockOutput {
  available: boolean;
  unavailableItems?: string[];
}

@Injectable()
export class CheckStockAvailabilityUseCase extends CommandUseCase<
  CheckStockInput,
  CheckStockOutput
> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(input: CheckStockInput): Promise<Result<CheckStockOutput>> {
    const unavailableItems: string[] = [];

    for (const item of input.items) {
      const sku = await this.prisma.sku.findUnique({
        where: { id: item.skuId },
      });

      if (!sku) {
        unavailableItems.push(item.skuId);
        continue;
      }

      const available = sku.stock - sku.reservedStock;
      if (available < item.quantity) {
        unavailableItems.push(sku.skuCode);
      }
    }

    if (unavailableItems.length > 0) {
      return Result.ok({
        available: false,
        unavailableItems,
      });
    }

    return Result.ok({ available: true });
  }
}
