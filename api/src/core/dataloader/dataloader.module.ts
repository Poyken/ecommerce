/**
 * =====================================================================
 * DATALOADER MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này export DataLoaderService để các module khác có thể inject.
 * DataLoaderService là REQUEST-SCOPED, nghĩa là:
 * - Mỗi HTTP request sẽ có một instance DataLoader riêng
 * - Cache chỉ tồn tại trong lifetime của request đó
 * - Tránh việc trả về data cũ giữa các request khác nhau
 * =====================================================================
 */

import { Module, Global } from '@nestjs/common';
import { DataLoaderService } from './dataloader.service';
import { PrismaModule } from '@core/prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [DataLoaderService],
  exports: [DataLoaderService],
})
export class DataLoaderModule {}
