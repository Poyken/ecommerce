import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

/**
 * =====================================================================
 * ADDRESSES MODULE - Module quản lý địa chỉ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA ACCESS:
 * - Import `PrismaModule` để thực hiện các thao tác CRUD với bảng `Address` trong database.
 *
 * 2. EXPORTS:
 * - `AddressesService` được export để các module khác (như OrderModule) có thể sử dụng để lấy địa chỉ giao hàng khi tạo đơn.
 *
 * 3. STRUCTURE:
 * - Tuân thủ cấu trúc chuẩn của NestJS: Controller xử lý request, Service xử lý logic, Module kết nối mọi thứ.
 * =====================================================================
 */
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';

@Module({
  imports: [PrismaModule],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
