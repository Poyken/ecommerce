import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

import * as path from 'path';
import * as fs from 'fs';
import { CloudinaryService } from '@/platform/integrations/external/cloudinary/cloudinary.service';

/**
 * =============================================================================
 * IMAGE PROCESSOR SERVICE - XỬ LÝ ẢNH AI
 * =============================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Service này giúp chuẩn hóa ảnh sản phẩm:
 * 1. Xóa phông nền - làm ảnh trông chuyên nghiệp
 * 2. Resize về kích thước chuẩn - đảm bảo đồng bộ trên website
 * 3. Nén ảnh - tối ưu tốc độ tải trang
 *
 * Lưu ý: Tính năng xóa phông cần @imgly/background-removal-node
 * npm install @imgly/background-removal-node
 * *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =============================================================================
 */

export interface ProcessedImage {
  original: string;
  thumbnail: string; // 100x100
  small: string; // 400x400
  medium: string; // 800x800
  large?: string; // 1200x1200 (optional)
}

export interface ProcessOptions {
  removeBackground?: boolean;
  backgroundColor?: string; // hex color e.g. "#ffffff"
  sizes?: number[];
  quality?: number;
  format?: 'webp' | 'png' | 'jpeg';
}

const DEFAULT_SIZES = [100, 400, 800];
const DEFAULT_QUALITY = 85;

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   * Xử lý ảnh: resize, nén, upload
   */
  async processImage(
    inputBuffer: Buffer,
    filename: string,
    options: ProcessOptions = {},
  ): Promise<ProcessedImage> {
    const {
      removeBackground = false,
      backgroundColor = '#ffffff',
      sizes = DEFAULT_SIZES,
      quality = DEFAULT_QUALITY,
      format = 'webp',
    } = options;

    this.logger.log(`Processing image: ${filename}`);

    try {
      // 1. Remove background if requested
      let processedBuffer = inputBuffer;
      if (removeBackground) {
        processedBuffer = await this.removeBackground(inputBuffer);
        // Add white background
        processedBuffer = await this.addBackground(
          processedBuffer,
          backgroundColor,
        );
      }

      // 2. Generate multiple sizes
      const results: ProcessedImage = {
        original: '',
        thumbnail: '',
        small: '',
        medium: '',
      };

      // Process original (max 1200px width)
      const originalBuffer = await sharp(processedBuffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .toFormat(format, { quality })
        .toBuffer();

      results.original = await this.uploadToCloudinary(
        originalBuffer,
        `${filename}_original`,
      );

      // Generate sizes
      for (const size of sizes) {
        const resizedBuffer = await sharp(processedBuffer)
          .resize(size, size, { fit: 'cover' })
          .toFormat(format, { quality })
          .toBuffer();

        const url = await this.uploadToCloudinary(
          resizedBuffer,
          `${filename}_${size}`,
        );

        if (size === 100) results.thumbnail = url;
        else if (size === 400) results.small = url;
        else if (size === 800) results.medium = url;
        else if (size === 1200) results.large = url;
      }

      this.logger.log(`✅ Image processed: ${filename}`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to process image: ${filename}`, error);
      throw error;
    }
  }

  /**
   * Xóa phông nền ảnh
   * Lưu ý: Cần cài @imgly/background-removal-node
   * npm install @imgly/background-removal-node
   */
  private async removeBackground(inputBuffer: Buffer): Promise<Buffer> {
    try {
      // Dynamic import để tránh lỗi nếu package chưa cài

      const bgRemoval = await import('@imgly/background-removal-node' as any);
      const { removeBackground: removeBg } = bgRemoval;

      this.logger.log('Removing background...');
      // Convert buffer to Uint8Array for compatibility
      const uint8Array = new Uint8Array(inputBuffer);
      const blob = new Blob([uint8Array], { type: 'image/png' });
      const resultBlob = await removeBg(blob);
      const arrayBuffer = await resultBlob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.warn(
        'Background removal failed (package may not be installed). Returning original.',
      );
      // Return original if rembg fails or not installed
      return inputBuffer;
    }
  }

  /**
   * Thêm màu nền cho ảnh (sau khi xóa phông)
   */
  private async addBackground(
    inputBuffer: Buffer,
    backgroundColor: string,
  ): Promise<Buffer> {
    // Parse hex color
    const r = parseInt(backgroundColor.slice(1, 3), 16);
    const g = parseInt(backgroundColor.slice(3, 5), 16);
    const b = parseInt(backgroundColor.slice(5, 7), 16);

    const metadata = await sharp(inputBuffer).metadata();

    // Create background layer
    const background = await sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 3,
        background: { r, g, b },
      },
    })
      .png()
      .toBuffer();

    // Composite image on background
    return sharp(background)
      .composite([{ input: inputBuffer }])
      .png()
      .toBuffer();
  }

  /**
   * Upload processed image to Cloudinary
   */
  private async uploadToCloudinary(
    buffer: Buffer,
    publicId: string,
  ): Promise<string> {
    // Create a file-like object for CloudinaryService
    const file = {
      buffer,
      originalname: `${publicId}.webp`,
    };

    const result = await this.cloudinaryService.uploadImage(file, 'products');
    return (result as any).secure_url;
  }

  /**
   * Chỉ resize ảnh (không xóa phông)
   */
  async resizeOnly(
    buffer: Buffer,
    width: number,
    height: number,
  ): Promise<Buffer> {
    return await sharp(buffer).resize(width, height).toBuffer();
  }

  /**
   * Nén ảnh
   */
  async compressImage(
    inputBuffer: Buffer,
    quality: number = 80,
  ): Promise<Buffer> {
    return sharp(inputBuffer).webp({ quality }).toBuffer();
  }
}
