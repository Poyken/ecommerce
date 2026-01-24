/**
 * =====================================================================
 * IMAGE-PROCESSOR.MODULE MODULE
 * =====================================================================
 *
 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { ImageProcessorService } from './image-processor.service';
import { ImageProcessorController } from './image-processor.controller';
import { CloudinaryModule } from '@/platform/integrations/external/cloudinary/cloudinary.module';

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
