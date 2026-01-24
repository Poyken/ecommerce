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

export interface TransferStockInput {
  userId: string;
  tenantId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  skuId: string;
  quantity: number;
  reason?: string;
}

export type TransferStockOutput = { success: true };
export type TransferStockError =
  | EntityNotFoundError
  | BusinessRuleViolationError;

@Injectable()
export class TransferStockUseCase extends CommandUseCase<
  TransferStockInput,
  TransferStockOutput,
  TransferStockError
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
    input: TransferStockInput,
  ): Promise<Result<TransferStockOutput, TransferStockError>> {
    if (input.fromWarehouseId === input.toWarehouseId) {
      return Result.fail(
        new BusinessRuleViolationError(
          'Source and destination warehouses must be different',
        ),
      );
    }

    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.warehouseRepository.findById(input.fromWarehouseId),
      this.warehouseRepository.findById(input.toWarehouseId),
    ]);

    if (!fromWarehouse || fromWarehouse.tenantId !== input.tenantId) {
      return Result.fail(
        new EntityNotFoundError('Warehouse', input.fromWarehouseId),
      );
    }
    if (!toWarehouse || toWarehouse.tenantId !== input.tenantId) {
      return Result.fail(
        new EntityNotFoundError('Warehouse', input.toWarehouseId),
      );
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Process Export from source
        let fromItem = await this.inventoryRepository.findItem(
          input.fromWarehouseId,
          input.skuId,
        );
        if (!fromItem || fromItem.quantity < input.quantity) {
          throw new BusinessRuleViolationError(
            `Insufficient stock in ${fromWarehouse.name}`,
          );
        }

        const prevFromStock = fromItem.quantity;
        fromItem.adjustQuantity(-input.quantity);
        await this.inventoryRepository.saveItem(fromItem, tx);

        // Log export
        await this.inventoryRepository.saveLog(
          InventoryLog.create({
            id: uuidv4(),
            tenantId: input.tenantId,
            skuId: input.skuId,
            changeAmount: -input.quantity,
            previousStock: prevFromStock,
            newStock: fromItem.quantity,
            reason: `[TRANSFER-OUT] ${input.reason || 'Transfer to ' + toWarehouse.name}`,
            userId: input.userId,
          }),
          tx,
        );

        // 2. Process Import to destination
        let toItem = await this.inventoryRepository.findItem(
          input.toWarehouseId,
          input.skuId,
        );
        const prevToStock = toItem ? toItem.quantity : 0;

        if (!toItem) {
          toItem = InventoryItem.create({
            id: uuidv4(),
            tenantId: input.tenantId,
            warehouseId: input.toWarehouseId,
            skuId: input.skuId,
          });
        }

        toItem.adjustQuantity(input.quantity);
        await this.inventoryRepository.saveItem(toItem, tx);

        // Log import
        await this.inventoryRepository.saveLog(
          InventoryLog.create({
            id: uuidv4(),
            tenantId: input.tenantId,
            skuId: input.skuId,
            changeAmount: input.quantity,
            previousStock: prevToStock,
            newStock: toItem.quantity,
            reason: `[TRANSFER-IN] ${input.reason || 'Transfer from ' + fromWarehouse.name}`,
            userId: input.userId,
          }),
          tx,
        );

        // NOTE: Total SKU stock doesn't change during transfer, so skipping tx.sku.update
      });

      return Result.ok({ success: true });
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
