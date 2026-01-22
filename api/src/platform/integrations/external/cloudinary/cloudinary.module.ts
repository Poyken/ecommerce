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
 * =====================================================================
 */
export class CloudinaryModule {}
