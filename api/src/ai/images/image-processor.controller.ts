/**
 * =====================================================================
 * IMAGE-PROCESSOR.CONTROLLER CONTROLLER
 * =====================================================================
 *
 * =====================================================================
 */

import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import {
  ImageProcessorService,
  ProcessOptions,
} from './image-processor.service';

@ApiTags('Image Processing')
@Controller('images')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImageProcessorController {
  constructor(private readonly imageProcessorService: ImageProcessorService) {}

  /**
   * Upload và xử lý ảnh sản phẩm
   * Options:
   * - removeBackground: true/false - Xóa phông nền
   * - backgroundColor: "#ffffff" - Màu nền mới
   */
  @Post('process')
  @ApiOperation({ summary: 'Process and upload product image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        removeBackground: { type: 'boolean' },
        backgroundColor: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async processImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: { removeBackground?: string; backgroundColor?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const processOptions: ProcessOptions = {
      removeBackground: options.removeBackground === 'true',
      backgroundColor: options.backgroundColor || '#ffffff',
    };

    const result = await this.imageProcessorService.processImage(
      file.buffer,
      file.originalname.replace(/\.[^/.]+$/, ''), // Remove extension
      processOptions,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Chỉ resize ảnh (không xóa phông)
   */
  @Post('resize')
  @ApiOperation({ summary: 'Resize image only' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async resizeImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: { width?: string; height?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const width = parseInt(options.width || '800', 10);
    const height = parseInt(options.height || '800', 10);

    const result = await this.imageProcessorService.resizeOnly(
      file.buffer,
      width,
      height,
    );

    return {
      success: true,
      data: {
        base64: result.toString('base64'),
        size: result.length,
      },
    };
  }
}
