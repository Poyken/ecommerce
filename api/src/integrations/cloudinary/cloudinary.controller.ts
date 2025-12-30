import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';

/**
 * =====================================================================
 * CLOUDINARY CONTROLLER - QUẢN LÝ TẢI ẢNH LÊN ĐÁM MÂY
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SIGNED UPLOAD (Tải lên có chữ ký):
 * - Thay vì gửi ảnh qua Server của mình (làm chậm server), ta cho phép Frontend (Client) gửi ảnh TRỰC TIẾP lên Cloudinary.
 * - Tuy nhiên, để bảo mật, Frontend phải xin Server một `signature` (chữ ký xác thực).
 * - API này tạo ra chữ ký đó dựa trên API Key và Secret Key của shop.
 *
 * 2. FOLDER MANAGEMENT:
 * - Ảnh sẽ được tổ chức theo các folder (VD: `products`, `blogs`) để dễ quản lý trên giao diện Cloudinary dashboard.
 * =====================================================================
 */
@ApiTags('Cloudinary')
@Controller('common/cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Get('signature')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy signature để upload ảnh trực tiếp từ Client' })
  getSignature(@Query('folder') folder?: string) {
    // Default folder to 'ecommerce-uploads' if not specified, or validate allowed folders
    const targetFolder = folder || 'ecommerce-uploads';
    return this.cloudinaryService.generateSignature(targetFolder);
  }
}
