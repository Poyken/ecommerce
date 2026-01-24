import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaModule } from '@/core/prisma/prisma.module';
import { PaymentModule } from '@/sales/payment/payment.module';

@Module({
  imports: [PrismaModule, PaymentModule],
  providers: [SubscriptionService],
  controllers: [SubscriptionController],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
