import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

import { PrismaModule } from '@core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CouponsService],
  controllers: [CouponsController],
  exports: [CouponsService],
})
/**
 * =====================================================================
 * COUPONS MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DEPENDENCY:
 * - Cần `PrismaModule` để kiểm tra mã giảm giá trong Database.
 *
 * 2. EXPORTS:
 * - Export `CouponsService` để module `Cart` hoặc `Checkout` có thể gọi hàm validation
 *   mà không cần duplicate logic. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
export class CouponsModule {}
