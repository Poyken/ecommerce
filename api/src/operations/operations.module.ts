/**
 * =====================================================================
 * OPERATIONS MODULE - Domain Module cho Vận hành
 * =====================================================================
 *
 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { FulfillmentModule } from './fulfillment/fulfillment.module';
import { ProcurementModule } from './procurement/procurement.module';
import { ReturnRequestsModule } from './return-requests/return-requests.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [
    FulfillmentModule,
    ProcurementModule,
    ReturnRequestsModule,
    InventoryModule,
  ],
  exports: [
    FulfillmentModule,
    ProcurementModule,
    ReturnRequestsModule,
    InventoryModule,
  ],
})
export class OperationsModule {}
