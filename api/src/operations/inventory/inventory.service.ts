/**
 * =====================================================================
 * INVENTORY SERVICE - QUẢN LÝ KHO HÀNG VÀ TỒN KHO
 * =====================================================================
 *
 * =====================================================================
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  CreateWarehouseDto,
  UpdateStockDto,
  TransferStockDto,
} from './dto/inventory.dto';
import { getTenant } from '@core/tenant/tenant.context';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private getTenantId(): string {
    const tenant = getTenant();
    if (!tenant?.id)
      throw new BadRequestException(
        'Không xác định được Cửa hàng (Tenant context missing)',
      );
    return tenant.id;
  }

  /**
   * Tạo kho hàng mới
   */
  async createWarehouse(dto: CreateWarehouseDto) {
    const tenantId = this.getTenantId();
    // Nếu đặt làm default, cần bỏ default của kho cũ
    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.warehouse.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  /**
   * Lấy danh sách kho
   */
  async getWarehouses() {
    const tenantId = this.getTenantId();
    return this.prisma.warehouse.findMany({
      where: { tenantId },
      include: { _count: { select: { inventoryItems: true } } },
    });
  }

  /**
   * Cập nhật tồn kho (Nhập/Xuất) cho một SKU tại một kho cụ thể
   * Tự động ghi Log (InventoryLog)
   * [P12 FIX]: Row-level Locking để tránh Race Condition khi cập nhật concurrent.
   */
  async updateStock(userId: string, dto: UpdateStockDto) {
    const tenantId = this.getTenantId();

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });
    if (!warehouse || warehouse.tenantId !== tenantId)
      throw new NotFoundException('Kho không tồn tại');

    // Transaction cập nhật kho và ghi log cùng lúc
    return this.prisma.$transaction(async (tx) => {
      // [P12 FIX] Row-level Locking: SELECT FOR UPDATE
      // This prevents concurrent updates from causing lost data
      const inventoryItem = await tx.$queryRaw<
        Array<{ id: string; quantity: number }>
      >`
        SELECT id, quantity 
        FROM "InventoryItem" 
        WHERE "warehouseId" = ${dto.warehouseId}::uuid 
          AND "skuId" = ${dto.skuId}::uuid
        FOR UPDATE
      `;

      const currentQty = inventoryItem.length > 0 ? inventoryItem[0].quantity : 0;
      const newQty = currentQty + dto.quantity;

      if (newQty < 0) {
        throw new BadRequestException(
          `Tồn kho tại kho ${warehouse.name} không đủ để xuất`,
        );
      }

      // 2. Upsert InventoryItem
      await tx.inventoryItem.upsert({
        where: {
          warehouseId_skuId: {
            warehouseId: dto.warehouseId,
            skuId: dto.skuId,
          },
        },
        create: {
          warehouseId: dto.warehouseId,
          skuId: dto.skuId,
          quantity: newQty,
          tenantId,
        },
        update: {
          quantity: newQty,
        },
      });

      // 3. Update Sku Total Stock
      await tx.sku.update({
        where: { id: dto.skuId },
        data: {
          stock: { increment: dto.quantity },
        },
      });

      // 4. Create Audit Log (InventoryLog) with structured data
      return tx.inventoryLog.create({
        data: {
          skuId: dto.skuId,
          changeAmount: dto.quantity,
          previousStock: currentQty,
          newStock: newQty,
          actionType: dto.quantity > 0 ? 'PURCHASE' : 'SALE',
          reason: `[${warehouse.name}] ${dto.reason}`,
          metadata: {
            warehouseId: dto.warehouseId,
            warehouseName: warehouse.name,
            delta: dto.quantity,
          },
          userId,
          tenantId,
        },
      });
    });
  }

  /**
   * Chuyển kho (Transfer Stock)
   */
  async transferStock(userId: string, dto: TransferStockDto) {
    const tenantId = this.getTenantId();

    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('Kho nguồn và kho đích phải khác nhau');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Xuất kho nguồn
      await this.updateStockInternal(
        tx,
        userId,
        {
          warehouseId: dto.fromWarehouseId,
          skuId: dto.skuId,
          quantity: -dto.quantity,
          reason: dto.reason || 'Chuyển sang kho khác',
        },
        tenantId,
      );

      // 2. Nhập kho đích
      const result = await this.updateStockInternal(
        tx,
        userId,
        {
          warehouseId: dto.toWarehouseId,
          skuId: dto.skuId,
          quantity: dto.quantity,
          reason: dto.reason || 'Nhận từ kho khác',
        },
        tenantId,
      );

      return result;
    });
  }

  /**
   * Hàm helper dùng nội bộ trong transaction để tránh nested transactions
   */
  private async updateStockInternal(
    tx: any,
    userId: string,
    dto: UpdateStockDto,
    tenantId: string,
  ) {
    const warehouse = await tx.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });
    if (!warehouse || warehouse.tenantId !== tenantId)
      throw new NotFoundException(`Kho ${dto.warehouseId} không tồn tại`);

    const inventoryItem = await tx.inventoryItem.findUnique({
      where: {
        warehouseId_skuId: {
          warehouseId: dto.warehouseId,
          skuId: dto.skuId,
        },
      },
    });

    const currentQty = inventoryItem ? inventoryItem.quantity : 0;
    const newQty = currentQty + dto.quantity;

    if (newQty < 0) {
      throw new BadRequestException(
        `Tồn kho tại kho ${warehouse.name} không đủ để chuyển đi`,
      );
    }

    await tx.inventoryItem.upsert({
      where: {
        warehouseId_skuId: {
          warehouseId: dto.warehouseId,
          skuId: dto.skuId,
        },
      },
      create: {
        warehouseId: dto.warehouseId,
        skuId: dto.skuId,
        quantity: newQty,
        tenantId,
      },
      update: {
        quantity: newQty,
      },
    });

    // Update SKU total stock
    await tx.sku.update({
      where: { id: dto.skuId },
      data: {
        stock: { increment: dto.quantity },
      },
    });

    return tx.inventoryLog.create({
      data: {
        skuId: dto.skuId,
        changeAmount: dto.quantity,
        previousStock: currentQty,
        newStock: newQty,
        actionType: dto.quantity > 0 ? 'TRANSFER_IN' : 'TRANSFER_OUT',
        reason: `[TRANSFER] ${dto.reason}`,
        metadata: {
          warehouseId: dto.warehouseId,
          warehouseName: warehouse.name,
          delta: dto.quantity,
        },
        userId,
        tenantId,
      },
    });
  }

  async getStockBySku(skuId: string) {
    const tenantId = this.getTenantId();
    return this.prisma.inventoryItem.findMany({
      where: {
        skuId,
        warehouse: { tenantId },
      },
      include: { warehouse: true },
    });
  }
}
