import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';

/**
 * =====================================================================
 * CLOUDINARY CONTROLLER - QUẢN LÝ TẢI ẢNH LÊN ĐÁM MÂY
 * =====================================================================
 *
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
