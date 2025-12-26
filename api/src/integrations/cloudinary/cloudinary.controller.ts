import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CloudinaryService } from './cloudinary.service';

/**
 * =====================================================================
 * CLOUDINARY CONTROLLER - Quản lý upload và signature
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
