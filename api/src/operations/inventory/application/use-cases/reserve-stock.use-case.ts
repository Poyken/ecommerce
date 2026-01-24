import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
} from '@/core/domain/errors/domain.error';

export interface ReserveStockInput {
  tenantId: string;
  items: Array<{
    skuId: string;
    quantity: number;
  }>;
  orderId: string;
}

@Injectable()
export class ReserveStockUseCase extends CommandUseCase<
  ReserveStockInput,
  void
> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(input: ReserveStockInput): Promise<Result<void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const item of input.items) {
          const sku = await tx.sku.findUnique({
            where: { id: item.skuId },
          });

          if (!sku) {
            throw new EntityNotFoundError('Sku', item.skuId);
          }

          const available = sku.stock - sku.reservedStock;
          if (available < item.quantity) {
            throw new BusinessRuleViolationError(
              `Insufficient stock for SKU ${sku.skuCode}. Available: ${available}, Requested: ${item.quantity}`,
            );
          }

          // Increment reservedStock
          await tx.sku.update({
            where: { id: item.skuId },
            data: {
              reservedStock: { increment: item.quantity },
            },
          });

          // Note: In a more advanced version, we would also create a record
          // linking this reservation to the order to allow timeouts/cleanup.
        }
      });

      return Result.ok(undefined);
    } catch (error) {
      if (
        error instanceof BusinessRuleViolationError ||
        error instanceof EntityNotFoundError
      ) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
