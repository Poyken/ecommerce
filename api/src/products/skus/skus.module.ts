import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SkusController } from './skus.controller';
import { SkusService } from './skus.service';

@Module({
  imports: [PrismaModule],
  controllers: [SkusController],
  providers: [SkusService],
})
export class SkusModule {}
