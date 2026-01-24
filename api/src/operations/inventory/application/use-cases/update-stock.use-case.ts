import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  EntityNotFoundError,
  BusinessRuleViolationError,
} from '@/core/domain/errors/domain.error';
import {
  IInventoryRepository,
  INVENTORY_REPOSITORY,
} from '../../domain/repositories/inventory.repository.interface';
import {
  IWarehouseRepository,
  WAREHOUSE_REPOSITORY,
} from '../../domain/repositories/warehouse.repository.interface';
import { InventoryItem } from '../../domain/entities/inventory-item.entity';
import { InventoryLog } from '../../domain/entities/inventory-log.entity';
import { v4 as uuidv4 } from 'uuid';

export interface UpdateStockInput {
  userId: string;
  tenantId: string;
  warehouseId: string;
  skuId: string;
  quantity: number; // change amount
  reason: string;
}

export type UpdateStockOutput = { inventoryLog: InventoryLog };
export type UpdateStockError = EntityNotFoundError | BusinessRuleViolationError;

@Injectable()
export class UpdateStockUseCase extends CommandUseCase<
  UpdateStockInput,
  UpdateStockOutput,
  UpdateStockError
> {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: IInventoryRepository,
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: IWarehouseRepository,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async execute(
    input: UpdateStockInput,
  ): Promise<Result<UpdateStockOutput, UpdateStockError>> {
    const warehouse = await this.warehouseRepository.findById(
      input.warehouseId,
    );
    if (!warehouse || warehouse.tenantId !== input.tenantId) {
      return Result.fail(
        new EntityNotFoundError('Warehouse', input.warehouseId),
      );
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        let inventoryItem = await this.inventoryRepository.findItem(
          input.warehouseId,
          input.skuId,
        );

        const previousStock = inventoryItem ? inventoryItem.quantity : 0;

        if (!inventoryItem) {
          inventoryItem = InventoryItem.create({
            id: uuidv4(),
            tenantId: input.tenantId,
            warehouseId: input.warehouseId,
            skuId: input.skuId,
            quantity: 0,
          });
        }

        // Adjust quantity
        inventoryItem.adjustQuantity(input.quantity);

        // Save item
        await this.inventoryRepository.saveItem(inventoryItem, tx);

        // Update SKU total stock
        await tx.sku.update({
          where: { id: input.skuId },
          data: {
            stock: { increment: input.quantity },
          },
        });

        // Create Log
        const log = InventoryLog.create({
          id: uuidv4(),
          tenantId: input.tenantId,
          skuId: input.skuId,
          changeAmount: input.quantity,
          previousStock,
          newStock: inventoryItem.quantity,
          reason: `[${warehouse.name}] ${input.reason}`,
          userId: input.userId,
        });

        const savedLog = await this.inventoryRepository.saveLog(log, tx);

        return { inventoryLog: savedLog };
      });

      return Result.ok(result);
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
