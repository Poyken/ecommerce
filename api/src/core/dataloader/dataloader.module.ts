/**
 * =====================================================================
 * DATALOADER MODULE
 * =====================================================================
 *
 * =====================================================================
 */

import { Module, Global } from '@nestjs/common';
import { DataLoaderService } from './dataloader.service';
import { PrismaModule } from '@core/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [DataLoaderService],
  exports: [DataLoaderService],
})
export class DataLoaderModule {}
