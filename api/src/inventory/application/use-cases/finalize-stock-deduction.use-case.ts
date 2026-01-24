import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PrismaService } from '@core/prisma/prisma.service';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import { v4 as uuidv4 } from 'uuid';

export interface FinalizeStockDeductionInput {
  tenantId: string;
  items: Array<{
    skuId: string;
    quantity: number;
  }>;
  orderId: string;
  userId?: string;
}

@Injectable()
export class FinalizeStockDeductionUseCase extends CommandUseCase<
  FinalizeStockDeductionInput,
  void
> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(input: FinalizeStockDeductionInput): Promise<Result<void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Find default warehouse for the tenant
        const warehouse =
          (await (tx as any).warehouse.findFirst({
            where: { tenantId: input.tenantId, isDefault: true },
          })) ||
          (await (tx as any).warehouse.findFirst({
            where: { tenantId: input.tenantId },
          }));

        if (!warehouse) {
          throw new Error('Warehouse configuration missing for tenant');
        }

        for (const item of input.items) {
          // 1. Update SKU (Reduce stock and reservedStock)
          await tx.sku.update({
            where: { id: item.skuId },
            data: {
              stock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });

          // 2. Update InventoryItem per warehouse
          const invItem = await (tx as any).inventoryItem.findUnique({
            where: {
              warehouseId_skuId: {
                warehouseId: warehouse.id,
                skuId: item.skuId,
              },
            },
          });

          const previousStock = invItem ? invItem.quantity : 0;
          const newStock = previousStock - item.quantity;

          await (tx as any).inventoryItem.upsert({
            where: {
              warehouseId_skuId: {
                warehouseId: warehouse.id,
                skuId: item.skuId,
              },
            },
            create: {
              warehouseId: warehouse.id,
              skuId: item.skuId,
              quantity: newStock,
              tenantId: input.tenantId,
            },
            update: {
              quantity: newStock,
            },
          });

          // 3. Log the change
          await (tx as any).inventoryLog.create({
            data: {
              skuId: item.skuId,
              tenantId: input.tenantId,
              changeAmount: -item.quantity,
              previousStock,
              newStock,
              reason: `Final stock deduction for order ${input.orderId}`,
              userId: input.userId,
            },
          });
        }
      });

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(error);
    }
  }
}
