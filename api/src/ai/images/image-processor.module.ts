/**
 * =====================================================================
 * IMAGE-PROCESSOR.MODULE MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này đóng gói các thành phần liên quan lại với nhau.
 *
 * 1. CẤU TRÚC MODULE:
 *    - imports: Các module khác cần sử dụng
 *    - controllers: Các controller xử lý request
 *    - providers: Các service cung cấp logic
 *    - exports: Các service cho module khác sử dụng *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { ImageProcessorService } from './image-processor.service';
import { ImageProcessorController } from './image-processor.controller';
import { CloudinaryModule } from '@/integrations/cloudinary/cloudinary.module';

/**
 * =============================================================================
 * IMAGE PROCESSOR MODULE - XỬ LÝ ẢNH AI
 * =============================================================================
 *
 * Module này cung cấp:
 * 1. Xóa phông nền (rembg) - sử dụng @imgly/background-removal-node
 * 2. Resize ảnh về kích thước chuẩn
 * 3. Tối ưu hóa ảnh sản phẩm
 *
 * =============================================================================
 */
@Module({
  imports: [CloudinaryModule],
  controllers: [ImageProcessorController],
  providers: [ImageProcessorService],
  exports: [ImageProcessorService],
})
export class ImageProcessorModule {}
