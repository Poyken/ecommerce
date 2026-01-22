/**
 * =====================================================================
 * SKUS CONTROLLER - Quản lý Biến thể sản phẩm (SKU)
 * =====================================================================
 *
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
import { CloudinaryService } from '@/platform/integrations/external/cloudinary/cloudinary.service';
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

import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
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
    return this.skusService.create(createSkuDto);
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
    return this.skusService.findOne(id);
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
    return this.skusService.update(id, updateSkuDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:delete')
  @ApiDeleteResponse('Sku', { summary: 'Xóa SKU' })
  async remove(@Param('id') id: string) {
    return this.skusService.remove(id);
  }
}
