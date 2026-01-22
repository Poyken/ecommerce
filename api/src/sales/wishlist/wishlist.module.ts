import { PrismaModule } from '@core/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [PrismaModule],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
/**
 * =====================================================================
 * WISHLIST MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SCOPE ISOLATION:
 * - Module này gom nhóm tất cả logic liên quan đến Yêu thích (Wishlist).
 * - Giúp code gọn gàng, dễ maintain, tránh lẫn lộn với Cart hay Product.
 *
 * 2. REUSABILITY:
 * - Nhờ `exports: [WishlistService]`, các module khác (như Product) có thể
 *   inject `WishlistService` để check xem user đã like sản phẩm chưa. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
export class WishlistModule {}
