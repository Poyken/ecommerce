import { PrismaModule } from '@core/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { BulkController } from './bulk.controller';
import { BulkService } from './bulk.service';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';

@Module({
  imports: [PrismaModule],
  controllers: [BulkController, SecurityController],
  providers: [BulkService, SecurityService],
  exports: [BulkService, SecurityService],
})
/**
 * =====================================================================
 * ADMIN MODULE
 * =====================================================================
 *
 * =====================================================================
 */
export class AdminModule {}
