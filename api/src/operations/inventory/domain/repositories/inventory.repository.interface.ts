import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryLog } from '../entities/inventory-log.entity';

export const INVENTORY_REPOSITORY = 'INVENTORY_REPOSITORY';

export abstract class IInventoryRepository {
  abstract findItem(
    warehouseId: string,
    skuId: string,
  ): Promise<InventoryItem | null>;
  abstract findBySku(skuId: string, tenantId: string): Promise<InventoryItem[]>;
  abstract saveItem(
    item: InventoryItem,
    transaction?: any,
  ): Promise<InventoryItem>;
  abstract saveLog(log: InventoryLog, transaction?: any): Promise<InventoryLog>;
  abstract getLogsBySku(
    skuId: string,
    tenantId: string,
  ): Promise<InventoryLog[]>;
}
