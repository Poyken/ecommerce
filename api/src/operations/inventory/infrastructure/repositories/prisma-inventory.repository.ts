import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';
import { InventoryItem } from '../../domain/entities/inventory-item.entity';
import { InventoryLog } from '../../domain/entities/inventory-log.entity';

@Injectable()
export class PrismaInventoryRepository extends IInventoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findItem(
    warehouseId: string,
    skuId: string,
  ): Promise<InventoryItem | null> {
    const data = await (this.prisma as any).inventoryItem.findUnique({
      where: {
        warehouseId_skuId: {
          warehouseId,
          skuId,
        },
      },
    });
    return data ? InventoryItem.fromPersistence(data) : null;
  }

  async findBySku(skuId: string, tenantId: string): Promise<InventoryItem[]> {
    const data = await (this.prisma as any).inventoryItem.findMany({
      where: {
        skuId,
        tenantId,
      },
      include: { warehouse: true },
    });
    return data.map((d: any) => InventoryItem.fromPersistence(d));
  }

  async saveItem(
    item: InventoryItem,
    transaction?: any,
  ): Promise<InventoryItem> {
    const data = item.toPersistence();
    const ctx = transaction || this.prisma;
    const saved = await (ctx as any).inventoryItem.upsert({
      where: {
        warehouseId_skuId: {
          warehouseId: item.warehouseId,
          skuId: item.skuId,
        },
      },
      create: data,
      update: data,
    });
    return InventoryItem.fromPersistence(saved);
  }

  async saveLog(log: InventoryLog, transaction?: any): Promise<InventoryLog> {
    const data = log.toPersistence();
    const ctx = transaction || this.prisma;
    const saved = await (ctx as any).inventoryLog.create({
      data,
    });
    return InventoryLog.fromPersistence(saved);
  }

  async getLogsBySku(skuId: string, tenantId: string): Promise<InventoryLog[]> {
    const data = await (this.prisma as any).inventoryLog.findMany({
      where: {
        skuId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });
    return data.map((d: any) => InventoryLog.fromPersistence(d));
  }
}
