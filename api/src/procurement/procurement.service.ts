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
import { InventoryService } from '@/inventory/inventory.service';
import { PurchaseOrderStatus } from '@prisma/client';

@Injectable()
export class ProcurementService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  private getTenantId(): string {
    const tenant = getTenant();
    if (!tenant?.id) throw new BadRequestException('Tenant context missing');
    return tenant.id;
  }

  // Supplier Logic
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

  // Purchase Order Logic
  async createPurchaseOrder(userId: string, dto: CreatePurchaseOrderDto) {
    const tenantId = this.getTenantId();

    // Verify supplier exists and belongs to tenant
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier || supplier.tenantId !== tenantId) {
      throw new NotFoundException('Supplier not found');
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
      throw new NotFoundException('Purchase order not found');
    }

    if (po.status === PurchaseOrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Cannot change status of a delivered order',
      );
    }

    // If changing to DELIVERED, trigger inventory update
    if (dto.status === PurchaseOrderStatus.DELIVERED) {
      await this.prisma.$transaction(async (tx) => {
        // 1. Update PO Status
        await tx.purchaseOrder.update({
          where: { id },
          data: { status: PurchaseOrderStatus.DELIVERED },
        });

        // 2. Update stock for each item in a warehouse
        // For simplicity, let's pick a default warehouse or one passed in the system
        // Here we assume a default warehouse exists for the tenant
        const defaultWarehouse = await tx.warehouse.findFirst({
          where: { tenantId, isDefault: true },
        });

        if (!defaultWarehouse) {
          throw new BadRequestException(
            'No default warehouse found for stock update',
          );
        }

        for (const item of po.items) {
          // We use the already available inventory service if possible,
          // but since we are in a transaction we manually do or call a specialized method
          await tx.inventoryItem.upsert({
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
            },
            update: {
              quantity: { increment: item.quantity },
            },
          });

          // Update audit log
          await tx.inventoryLog.create({
            data: {
              skuId: item.skuId,
              tenantId,
              changeAmount: item.quantity,
              previousStock: 0, // Simplified: ideally we find the previous value
              newStock: 0, // Simplified
              reason: `Nhập hàng từ PO #${po.id}`,
              userId,
            },
          });

          // Update total stock in SKU (legacy support)
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
