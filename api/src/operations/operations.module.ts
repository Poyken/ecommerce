/**
 * =====================================================================
 * OPERATIONS MODULE - Domain Module cho Vận hành
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Domain Module này gộp các module liên quan đến Vận hành (Back-office):
 * - FulfillmentModule: Xử lý đơn hàng, đóng gói, giao vận
 * - ProcurementModule: Quản lý Mua hàng, Nhập kho (NCC)
 * - ReturnRequestsModule: Quản lý Yêu cầu trả hàng (RMA)
 *
 * 🎯 LỢI ÍCH:
 * - Tập trung logic vận hành kho vận và xử lý sau bán hàng
 * - Tách biệt với logic bán hàng (Sales) và sản phẩm (Catalog)
 *
 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { FulfillmentModule } from './fulfillment/fulfillment.module';
import { ProcurementModule } from './procurement/procurement.module';
import { ReturnRequestsModule } from './return-requests/return-requests.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [FulfillmentModule, ProcurementModule, ReturnRequestsModule, InventoryModule],
  exports: [FulfillmentModule, ProcurementModule, ReturnRequestsModule, InventoryModule],
})
export class OperationsModule {}
