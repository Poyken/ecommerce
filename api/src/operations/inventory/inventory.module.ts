import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from '@core/prisma/prisma.module';
import { EmailModule } from '@/platform/integrations/external/email/email.module';
import { InventoryAlertsService } from './alerts/inventory-alerts.service';
import { InventoryAlertsController } from './alerts/inventory-alerts.controller';

// Clean Architecture
import { WAREHOUSE_REPOSITORY } from './domain/repositories/warehouse.repository.interface';
import { INVENTORY_REPOSITORY } from './domain/repositories/inventory.repository.interface';
import { PrismaWarehouseRepository } from './infrastructure/repositories/prisma-warehouse.repository';
import { PrismaInventoryRepository } from './infrastructure/repositories/prisma-inventory.repository';

// Use Cases
import { UpdateStockUseCase } from './application/use-cases/update-stock.use-case';
import { TransferStockUseCase } from './application/use-cases/transfer-stock.use-case';
import { CreateWarehouseUseCase } from './application/use-cases/create-warehouse.use-case';
import { GetWarehousesUseCase } from './application/use-cases/get-warehouses.use-case';
import { GetStockBySkuUseCase } from './application/use-cases/get-stock-by-sku.use-case';
import { ReserveStockUseCase } from './application/use-cases/reserve-stock.use-case';
import { FinalizeStockDeductionUseCase } from './application/use-cases/finalize-stock-deduction.use-case';
import { ReleaseStockReservationUseCase } from './application/use-cases/release-stock-reservation.use-case';
import { CheckStockAvailabilityUseCase } from './application/use-cases/check-stock-availability.use-case';

import { InventoryService } from './inventory.service';
import { OrderEventsHandler } from './application/handlers/order-events.handler';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [InventoryController, InventoryAlertsController],
  providers: [
    OrderEventsHandler,
    // Repositories
    {
      provide: WAREHOUSE_REPOSITORY,
      useClass: PrismaWarehouseRepository,
    },
    {
      provide: INVENTORY_REPOSITORY,
      useClass: PrismaInventoryRepository,
    },

    // Legacy Service
    InventoryService,
    InventoryAlertsService,

    // Use Cases
    UpdateStockUseCase,
    TransferStockUseCase,
    CreateWarehouseUseCase,
    GetWarehousesUseCase,
    GetStockBySkuUseCase,
    ReserveStockUseCase,
    FinalizeStockDeductionUseCase,
    ReleaseStockReservationUseCase,
    CheckStockAvailabilityUseCase,
  ],
  exports: [
    InventoryService,
    InventoryAlertsService,
    WAREHOUSE_REPOSITORY,
    INVENTORY_REPOSITORY,
    UpdateStockUseCase,
    TransferStockUseCase,
    CreateWarehouseUseCase,
    GetWarehousesUseCase,
    GetStockBySkuUseCase,
    ReserveStockUseCase,
    FinalizeStockDeductionUseCase,
    ReleaseStockReservationUseCase,
    CheckStockAvailabilityUseCase,
  ],
})
export class InventoryModule {}
