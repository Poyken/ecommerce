import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { CouponsController } from './coupons.controller';
import { PrismaModule } from '@core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PromotionsController, CouponsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
