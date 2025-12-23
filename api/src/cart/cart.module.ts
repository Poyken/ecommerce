import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

/**
 * =====================================================================
 * CART MODULE - Module quản lý giỏ hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MODULE ENCAPSULATION:
 * - Module này gom nhóm các thành phần liên quan đến giỏ hàng: Controller (xử lý HTTP), Service (xử lý logic).
 *
 * 2. PRISMA INTEGRATION:
 * - `PrismaModule` được import để `CartService` có thể truy cập vào database.
 *
 * 3. ARCHITECTURE:
 * - Tuân thủ kiến trúc Modular của NestJS, giúp code dễ bảo trì và mở rộng.
 * =====================================================================
 */
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
