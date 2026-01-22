import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaModule } from '@core/prisma/prisma.module';
import { EmailModule } from '@/platform/integrations/external/email/email.module';
import { InventoryAlertsService } from './alerts/inventory-alerts.service';
import { InventoryAlertsController } from './alerts/inventory-alerts.controller';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [InventoryController, InventoryAlertsController],
  providers: [InventoryService, InventoryAlertsService],
  exports: [InventoryService, InventoryAlertsService],
})
export class InventoryModule {}
