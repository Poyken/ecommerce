/**
 * =====================================================================
 * BRANDS CONTROLLER - Quản lý Thương hiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CACHING STRATEGY (`@Cached`):
 * - Danh sách Brands (Thương hiệu) RẤT ÍT KHI THAY ĐỔI.
 * - Sử dụng `@Cached(300)` để cache kết quả trong 5 phút.
 * - Giảm tải DB đáng kể vì API này được gọi ở mọi trang Product Filter.
 *
 * 2. MULTIPART UPLOAD:
 * - Hỗ trợ upload Logo thương hiệu qua `FileInterceptor`. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  Cached,
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
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { BrandsService } from './brands.service';
import { BrandsExportService } from './brands-export.service';
import { BrandsImportService } from './brands-import.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@ApiTags('Product Brands')
@Controller('brands')
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly exportService: BrandsExportService,
    private readonly importService: BrandsImportService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiCreateResponse('Brand', { summary: 'Create new brand' })
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  @Cached(300) // Cache 5 phút (300s)
  @ApiListResponse('Brand', { summary: 'Get all brands (cached 5 mins)' })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.brandsService.findAll(search, Number(page), Number(limit));
  }

  @Get('export/excel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:read')
  @ApiOperation({ summary: 'Export Brands to Excel' })
  async export(@Res() res: any) {
    return this.exportService.exportToExcel(res);
  }

  @Post('import/excel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import Brands from Excel' })
  async import(@UploadedFile() file: Express.Multer.File) {
    return this.importService.importFromExcel(file);
  }

  @Post('import/preview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Preview Brands import' })
  async preview(@UploadedFile() file: Express.Multer.File) {
    return this.importService.previewFromExcel(file);
  }

  @Get('import/template')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:create')
  @ApiOperation({ summary: 'Download Brand Import Template' })
  async downloadTemplate(@Res() res: any) {
    return this.importService.generateTemplate(res);
  }

  @Get(':id')
  @ApiGetOneResponse('Brand', { summary: 'Get brand details' })
  async findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:update')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiUpdateResponse('Brand', { summary: 'Update brand' })
  async update(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:delete')
  @ApiDeleteResponse('Brand', { summary: 'Delete brand' })
  async remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
