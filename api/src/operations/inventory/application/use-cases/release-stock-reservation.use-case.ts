import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PrismaService } from '@core/prisma/prisma.service';

export interface ReleaseStockReservationInput {
  tenantId: string;
  items: Array<{
    skuId: string;
    quantity: number;
  }>;
  orderId: string;
  wasPaid: boolean;
}

@Injectable()
export class ReleaseStockReservationUseCase extends CommandUseCase<
  ReleaseStockReservationInput,
  void
> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(input: ReleaseStockReservationInput): Promise<Result<void>> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const item of input.items) {
          if (input.wasPaid) {
            // If it was already paid, stock was already deducted. So we RESTORE stock.
            await tx.sku.update({
              where: { id: item.skuId },
              data: {
                stock: { increment: item.quantity },
              },
            });

            // Also need to update InventoryItem and Log if we want fully accurate logs.
            // For simplicity in cancellation, we focus on the SKU stock first.
            // But let's be thorough.
            const warehouse =
              (await (tx as any).warehouse.findFirst({
                where: { tenantId: input.tenantId, isDefault: true },
              })) ||
              (await (tx as any).warehouse.findFirst({
                where: { tenantId: input.tenantId },
              }));

            if (warehouse) {
              const invItem = await (tx as any).inventoryItem.findUnique({
                where: {
                  warehouseId_skuId: {
                    warehouseId: warehouse.id,
                    skuId: item.skuId,
                  },
                },
              });
              const previousStock = invItem ? invItem.quantity : 0;
              const newStock = previousStock + item.quantity;

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
                update: { quantity: newStock },
              });

              await (tx as any).inventoryLog.create({
                data: {
                  skuId: item.skuId,
                  tenantId: input.tenantId,
                  changeAmount: item.quantity,
                  previousStock,
                  newStock,
                  reason: `Restored stock from cancelled paid order ${input.orderId}`,
                },
              });
            }
          } else {
            // If it was NOT paid, only reserved STOCK needs releasing.
            await tx.sku.update({
              where: { id: item.skuId },
              data: {
                reservedStock: { decrement: item.quantity },
              },
            });
          }
        }
      });

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(error);
    }
  }
}
