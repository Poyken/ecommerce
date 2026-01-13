import { Module } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { EmailModule } from '@/integrations/email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [LoyaltyService],
  controllers: [LoyaltyController],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
