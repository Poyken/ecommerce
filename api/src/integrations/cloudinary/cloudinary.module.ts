import { Module } from '@nestjs/common';
import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';

/**
 * =====================================================================
 * CLOUDINARY MODULE - Module tích hợp lưu trữ đám mây
 * =====================================================================
 */

@Module({
  controllers: [CloudinaryController],
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryProvider, CloudinaryService],
})
/**
 * =====================================================================
 * CLOUDINARY MODULE - Module tích hợp lưu trữ đám mây
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PROVIDER PATTERN:
 * - `CloudinaryProvider`: Là nơi cấu hình SDK (API Key, Secret).
 * - `CloudinaryService`: Là nơi viết các hàm upload/delete ảnh.
 *
 * 2. SHARED MODULE:
 * - Module này được dùng chung bởi nhiều module khác (Product, Blog, User Avatar). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
export class CloudinaryModule {}
