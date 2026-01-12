import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CreateWarehouseDto, UpdateStockDto } from './dto/inventory.dto';
import { getTenant } from '@core/tenant/tenant.context';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private getTenantId(): string {
    const tenant = getTenant();
    if (!tenant?.id) throw new BadRequestException('Tenant context missing');
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
   */
  async updateStock(userId: string, dto: UpdateStockDto) {
    const tenantId = this.getTenantId();

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
    });
    if (!warehouse || warehouse.tenantId !== tenantId)
      throw new NotFoundException('Kho không tồn tại');

    // Tìm item trong kho, nếu chưa có thì tạo mới
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
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
      throw new BadRequestException('Tồn kho không đủ để xuất');
    }

    // Transaction cập nhật kho và ghi log cùng lúc
    return this.prisma.$transaction(async (tx) => {
      // 1. Upsert InventoryItem
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
        },
        update: {
          quantity: newQty,
        },
      });

      // 2. Update Legacy Sku Stock (Optional: Sync tổng tồn kho về bảng Sku để FE dễ hiển thị)
      // Tính tổng stock của SKU này ở tất cả các kho
      const allItems = await tx.inventoryItem.findMany({
        where: { skuId: dto.skuId },
      });
      const totalStock = allItems.reduce((acc, item) => acc + item.quantity, 0); // Note: cái này chưa tính cái vừa update nếu chưa commit, nhưng trong transaction thì findMany sẽ thấy data mới nếu isolation level cho phép.
      // Thực tế prisma transaction client nhìn thấy write của chính nó.
      // Tuy nhiên logic trên hơi rủi ro, để đơn giản ta cộng trực tiếp vào SKU luôn.

      await tx.sku.update({
        where: { id: dto.skuId },
        data: {
          stock: { increment: dto.quantity },
        },
      });

      // 3. Create Audit Log (InventoryLog)
      return tx.inventoryLog.create({
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
