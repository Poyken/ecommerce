import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';

/**
 * =====================================================================
 * CLOUDINARY MODULE - Module tích hợp lưu trữ đám mây
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. EXTERNAL SERVICE INTEGRATION:
 * - Module này đóng vai trò là cầu nối giữa ứng dụng của chúng ta và dịch vụ Cloudinary.
 *
 * 2. EXPORTS:
 * - Ta export cả `CloudinaryProvider` và `CloudinaryService` để các module khác (như ProductModule) có thể sử dụng để tải ảnh sản phẩm lên.
 * =====================================================================
 */

@Module({
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryProvider, CloudinaryService],
})
export class CloudinaryModule {}
