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
 * - Tránh việc trả về data cũ giữa các request khác nhau *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Request Lifecycle Management: Đảm bảo bộ nhớ server không bị "rò rỉ" (Memory Leak) vì cache tự động được dọn dẹp sau khi trả response.
 * - Global Availability: Cung cấp công cụ tối ưu Database cho toàn bộ hệ thống (dù ở Controller A hay Service B).

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
