import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';
import { BulkController } from './bulk.controller';
import { BulkService } from './bulk.service';

@Module({
  imports: [PrismaModule],
  controllers: [BulkController],
  providers: [BulkService],
  exports: [BulkService],
})
export class AdminModule {}
