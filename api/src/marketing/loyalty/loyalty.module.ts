import { Module } from '@nestjs/common';
import { LoyaltyController } from './loyalty.controller';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { EmailModule } from '@/platform/integrations/external/email/email.module';

// Clean Architecture
import { LOYALTY_REPOSITORY } from './domain/repositories/loyalty.repository.interface';
import { PrismaLoyaltyRepository } from './infrastructure/repositories/prisma-loyalty.repository';
import * as UseCases from './application/use-cases';
import { LoyaltyOrderEventsHandler } from './application/handlers/order-events.handler';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [
    {
      provide: LOYALTY_REPOSITORY,
      useClass: PrismaLoyaltyRepository,
    },
    ...Object.values(UseCases),
    LoyaltyOrderEventsHandler,
  ],
  controllers: [LoyaltyController],
  exports: [LOYALTY_REPOSITORY, ...Object.values(UseCases)],
})
export class LoyaltyModule {}
