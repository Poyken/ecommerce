import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { CouponsController } from './coupons.controller';
import { PrismaModule } from '@core/prisma/prisma.module';

// Clean Architecture
import { PROMOTION_REPOSITORY } from './domain/repositories/promotion.repository.interface';
import { PrismaPromotionRepository } from './infrastructure/repositories/prisma-promotion.repository';
import * as UseCases from './application/use-cases';

@Module({
  imports: [PrismaModule],
  controllers: [PromotionsController, CouponsController],
  providers: [
    PromotionsService,
    {
      provide: PROMOTION_REPOSITORY,
      useClass: PrismaPromotionRepository,
    },
    ...Object.values(UseCases),
  ],
  exports: [
    PromotionsService,
    PROMOTION_REPOSITORY,
    ...Object.values(UseCases),
  ],
})
export class PromotionsModule {}
