/**
 * =====================================================================
 * INVENTORY SERVICE - QUẢN LÝ KHO HÀNG VÀ TỒN KHO
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Hệ thống quản lý kho của chúng ta hỗ trợ "Đa kho" (Multi-warehouse).
 *
 * 1. MÔ HÌNH DỮ LIỆU:
 *    - Warehouse: Thông tin kho (Địa chỉ, Tên, Kho mặc định).
 *    - InventoryItem: Liên kết giữa SKU và Warehouse (Biết SKU này trong kho kia còn bao nhiêu).
 *    - InventoryLog: Nhật ký mọi biến động (Nhập, Xuất, Hoàn trả) để đối soát.
 *
 * 2. CƠ CHẾ CẬP NHẬT:
 *    - Luôn dùng Transaction khi cập nhật tồn kho để đảm bảo tính nhất quán.
 *    - Khi thay đổi số lượng ở InventoryItem, phải cập nhật đồng thời ở bảng Sku
 *      (cột stock tổng) để hiển thị nhanh trên Storefront.
 *    - Mọi thay đổi phải có lý do (reason) và người thực hiện (userId).
 *
 * 3. TENANCY:
 *    - Các kho hàng tách biệt hoàn toàn theo TenantId.
 *    - Shipper/Nhân viên kho chỉ thấy kho của cửa hàng họ.
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
      await (this.prisma as any).warehouse.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return (this.prisma as any).warehouse.create({
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
    return (this.prisma as any).warehouse.findMany({
      where: { tenantId },
      include: { _count: { select: { inventoryItems: true } } },
    });
  }

  /**
   * Cập nhật tồn kho (Nhập/Xuất) cho một SKU tại một kho cụ thể
   * Tự động ghi Log (InventoryLog)
   */
  async updateStock(userId: string, dto: UpdateStockDto) {
    const tenantId = this.getTenantId();

    const warehouse = await (this.prisma as any).warehouse.findUnique({
      where: { id: dto.warehouseId },
    });
    if (!warehouse || warehouse.tenantId !== tenantId)
      throw new NotFoundException('Kho không tồn tại');

    // Transaction cập nhật kho và ghi log cùng lúc
    return this.prisma.$transaction(async (tx) => {
      // 1. Tìm hoặc tạo mới InventoryItem
      const inventoryItem = await (tx as any).inventoryItem.findUnique({
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
          `Tồn kho tại kho ${warehouse.name} không đủ để xuất`,
        );
      }

      // 2. Upsert InventoryItem
      await (tx as any).inventoryItem.upsert({
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

      // 4. Create Audit Log (InventoryLog)
      return (tx as any).inventoryLog.create({
        data: {
          skuId: dto.skuId,
          changeAmount: dto.quantity,
          previousStock: currentQty,
          newStock: newQty,
          reason: `[${warehouse.name}] ${dto.reason}`,
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

    await (tx as any).inventoryItem.upsert({
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

    return (tx as any).inventoryLog.create({
      data: {
        skuId: dto.skuId,
        changeAmount: dto.quantity,
        previousStock: currentQty,
        newStock: newQty,
        reason: `[TRANSFER] ${dto.reason}`,
        userId,
        tenantId,
      },
    });
  }

  async getStockBySku(skuId: string) {
    const tenantId = this.getTenantId();
    return (this.prisma as any).inventoryItem.findMany({
      where: {
        skuId,
        warehouse: { tenantId },
      },
      include: { warehouse: true },
    });
  }
}
