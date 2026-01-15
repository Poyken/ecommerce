import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
  controllers: [PromotionsController],
  providers: [PromotionsService]
=======
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { PrismaModule } from '@core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
>>>>>>> 8f5a875198d5ce2371ec25b2aeb50dc403c8c172
})
export class PromotionsModule {}
