/**
 * =====================================================================
 * PROCUREMENT SERVICE - QUẢN LÝ NHẬP HÀNG (MUA HÀNG)
 * =====================================================================
 *
 * =====================================================================
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { getTenant } from '@/core/tenant/tenant.context';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from './dto/procurement.dto';
import { InventoryService } from '@/operations/inventory/inventory.service';
import { PurchaseOrderStatus } from '@prisma/client';

@Injectable()
export class ProcurementService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  private getTenantId(): string {
    const tenant = getTenant();
    if (!tenant?.id)
      throw new BadRequestException(
        'Không xác định được Cửa hàng (Tenant context missing)',
      );
    return tenant.id;
  }

  // Logic Nhà cung cấp
  async createSupplier(dto: CreateSupplierDto) {
    const tenantId = this.getTenantId();
    return this.prisma.supplier.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async getSuppliers() {
    const tenantId = this.getTenantId();
    return this.prisma.supplier.findMany({
      where: { tenantId, deletedAt: null },
    });
  }

  // Logic Đơn nhập hàng (Purchase Order)
  async createPurchaseOrder(userId: string, dto: CreatePurchaseOrderDto) {
    const tenantId = this.getTenantId();

    // Kiểm tra nhà cung cấp có tồn tại và thuộc tenant không
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier || supplier.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy Nhà cung cấp');
    }

    return this.prisma.purchaseOrder.create({
      data: {
        supplierId: dto.supplierId,
        notes: dto.notes,
        status: PurchaseOrderStatus.PENDING,
        tenantId,
        items: {
          create: dto.items.map((item) => ({
            skuId: item.skuId,
            quantity: item.quantity,
            costPrice: item.costPrice,
          })),
        },
      },
      include: { items: true },
    });
  }

  async getPurchaseOrders() {
    const tenantId = this.getTenantId();
    return this.prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: { supplier: true, items: true },
    });
  }

  async updateOrderStatus(
    userId: string,
    id: string,
    dto: UpdatePurchaseOrderStatusDto,
  ) {
    const tenantId = this.getTenantId();

    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });

    if (!po) {
      throw new NotFoundException('Không tìm thấy đơn nhập hàng');
    }

    if (po.status === PurchaseOrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Không thể thay đổi trạng thái của đơn hàng đã nhập kho thành công',
      );
    }

    // Nếu chuyển sang DELIVERED -> Kích hoạt cập nhật kho hàng
    if (dto.status === PurchaseOrderStatus.DELIVERED) {
      await this.prisma.$transaction(async (tx) => {
        // 1. Cập nhật trạng thái PO
        await tx.purchaseOrder.update({
          where: { id },
          data: { status: PurchaseOrderStatus.DELIVERED },
        });

        // 2. Cập nhật tồn kho (mặc định lấy kho default của shop)
        const defaultWarehouse = await tx.warehouse.findFirst({
          where: { tenantId, isDefault: true },
        });

        if (!defaultWarehouse) {
          throw new BadRequestException(
            'Không tìm thấy kho hàng mặc định để nhập hàng',
          );
        }

        for (const item of po.items) {
          // Cập nhật bảng liên kết Kho - SKU
          await (tx.inventoryItem.upsert as any)({
            where: {
              warehouseId_skuId: {
                warehouseId: defaultWarehouse.id,
                skuId: item.skuId,
              },
            },
            create: {
              warehouseId: defaultWarehouse.id,
              skuId: item.skuId,
              quantity: item.quantity,
              tenantId,
            },
            update: {
              quantity: { increment: item.quantity },
            },
          });

          // Ghi nhật ký biến động kho (Audit Log)
          await tx.inventoryLog.create({
            data: {
              skuId: item.skuId,
              tenantId,
              changeAmount: item.quantity,
              previousStock: 0, // Simplified
              newStock: 0, // Simplified
              reason: `Nhập hàng từ PO #${po.id}`,
              userId,
            },
          });

          // Đồng bộ tồn kho tổng của SKU (legacy support)
          await tx.sku.update({
            where: { id: item.skuId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });
    } else {
      await this.prisma.purchaseOrder.update({
        where: { id },
        data: { status: dto.status },
      });
    }

    return { success: true };
  }
}
