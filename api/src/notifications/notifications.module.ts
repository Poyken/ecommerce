import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EmailProcessor } from './processors/email.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  providers: [EmailProcessor],
  exports: [BullModule], // Xuất BullModule để các module khác có thể inject hàng đợi
})
export class NotificationsModule {}
