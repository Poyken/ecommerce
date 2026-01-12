/**
 * =====================================================================
 * SKUS CONTROLLER - Quản lý Biến thể sản phẩm (SKU)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SKU LÀ GÌ?
 * - Stock Keeping Unit (Đơn vị lưu kho).
 * - Cùng 1 sản phẩm "Áo thun", sẽ có nhiều SKU: "Áo Đỏ Size M", "Áo Xanh Size L".
 * - Giá và Số lượng tồn kho nằm ở SKU, KHÔNG nằm ở Product cha.
 *
 * 2. IMAGE HANDLING:
 * - Mỗi SKU có thể có ảnh riêng (VD: click chọn màu Đỏ -> ảnh áo đỏ hiện ra).
 * - Controller này xử lý upload ảnh lên Cloudinary ngay khi tạo/sửa SKU.
 * =====================================================================
 */
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';
import { CloudinaryService } from '@integrations/cloudinary/cloudinary.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { SkusService } from './skus.service';

@ApiTags('Product SKUs')
@Controller('skus')
export class SkusController {
  constructor(
    private readonly skusService: SkusService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiCreateResponse('Sku', { summary: 'Tạo SKU mới (Biến thể)' })
  async create(
    @Body() createSkuDto: CreateSkuDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      createSkuDto.imageUrl = result.secure_url;
    }
    const data = await this.skusService.create(createSkuDto);
    return { data };
  }

  @Get()
  @ApiListResponse('Sku', { summary: 'Lấy danh sách SKU' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
  })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('stockLimit') stockLimit?: number,
  ) {
    return this.skusService.findAll(
      Number(page),
      Number(limit),
      status,
      search,
      stockLimit ? Number(stockLimit) : undefined,
    );
  }

  @Get(':id')
  @ApiGetOneResponse('Sku', { summary: 'Lấy chi tiết SKU' })
  async findOne(@Param('id') id: string) {
    const data = await this.skusService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:update')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiUpdateResponse('Sku', {
    summary: 'Cập nhật thông tin SKU (Giá, Tồn kho...)',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSkuDto: UpdateSkuDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      updateSkuDto.imageUrl = result.secure_url;
    }
    const data = await this.skusService.update(id, updateSkuDto);
    return { data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:delete')
  @ApiDeleteResponse('Sku', { summary: 'Xóa SKU' })
  async remove(@Param('id') id: string) {
    const data = await this.skusService.remove(id);
    return { data };
  }
}
