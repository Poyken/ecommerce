import { Module } from '@nestjs/common';
import { InventoryAlertsService } from './inventory-alerts.service';
import { InventoryAlertsController } from './inventory-alerts.controller';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { EmailModule } from '@/integrations/email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [InventoryAlertsService],
  controllers: [InventoryAlertsController],
  exports: [InventoryAlertsService],
})
export class InventoryAlertsModule {}
