import { Module } from '@nestjs/common';
import { DevToolsController } from './dev-tools.controller';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { LoyaltyModule } from '@/marketing/loyalty/loyalty.module';

@Module({
  imports: [PrismaModule, LoyaltyModule],
  controllers: [DevToolsController],
})
export class DevToolsModule {}

