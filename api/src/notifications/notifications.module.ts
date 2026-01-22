import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

/**
 * =====================================================================
 * NOTIFICATIONS MODULE - Module quản lý thông báo và hàng đợi
 * =====================================================================
 *
 * =====================================================================
 */
import { EmailProcessor } from './processors/email.processor';

import { EmailModule } from '@/platform/integrations/external/email/email.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    EmailModule,
  ],
  controllers: [NotificationsController],
  providers: [EmailProcessor, NotificationsService, NotificationsGateway],
  exports: [BullModule, NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
