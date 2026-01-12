import { Module } from '@nestjs/common';
import { RmaService } from './rma.service';
import { RmaController } from './rma.controller';
import { PrismaModule } from '@core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RmaController],
  providers: [RmaService],
  exports: [RmaService],
})
export class RmaModule {}
