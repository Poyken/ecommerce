import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * =====================================================================
 * PRISMA MODULE - Module quản lý kết nối Database
 * =====================================================================
 *
 * =====================================================================
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
