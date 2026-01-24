import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditProcessor } from './audit.processor';
import { AuditService } from './audit.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audit',
    }),
  ],
  providers: [AuditService, AuditProcessor],
  controllers: [AuditController],
  exports: [AuditService],
})
/**
 * =====================================================================
 * AUDIT MODULE - Hệ thống ghi nhật ký hoạt động
 * =====================================================================
 *
 * =====================================================================
 */
export class AuditModule {}
