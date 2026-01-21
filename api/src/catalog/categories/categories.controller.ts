/**
 * =====================================================================
 * CATEGORIES CONTROLLER
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HIERARCHY DATA:
 * - Danh mục thường có cấu trúc cây (Cha - Con).
 * - Controller này cung cấp API CRUD cơ bản.
 * - API `findAll` có cache vì danh mục ít thay đổi. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, validate dữ liệu và điều phối xử lý logic thông qua các Service tương ứng.

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
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'; // Added ApiOperation

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { CategoriesService } from './categories.service';
import { CategoriesExportService } from './categories-export.service'; // Added
import { CategoriesImportService } from './categories-import.service'; // Added
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories') // Changed tag
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly exportService: CategoriesExportService, // Added
    private readonly importService: CategoriesImportService, // Added
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:create') // Changed permission
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiCreateResponse('Category', { summary: 'Tạo danh mục mới (Admin)' }) // Changed summary
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiListResponse('Category', {
    summary: 'Get all categories (cached 5 mins)',
  })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 100,
  ) {
    return this.categoriesService.findAll(search, Number(page), Number(limit));
  }

  @Get('export/excel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:read')
  @ApiOperation({ summary: 'Export Categories to Excel' })
  async export(@Res() res: any) {
    return this.exportService.exportToExcel(res);
  }

  @Post('import/excel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import Categories from Excel' })
  async import(@UploadedFile() file: Express.Multer.File) {
    return this.importService.importFromExcel(file);
  }

  @Post('import/preview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Preview Categories import' })
  async preview(@UploadedFile() file: Express.Multer.File) {
    return this.importService.previewFromExcel(file);
  }

  @Get('import/template')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:create')
  @ApiOperation({ summary: 'Download Category Import Template' })
  async downloadTemplate(@Res() res: any) {
    return this.importService.generateTemplate(res);
  }

  @Get(':id')
  @ApiGetOneResponse('Category', { summary: 'Get category details' })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('category:update')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiUpdateResponse('Category', { summary: 'Update category' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('category:delete')
  @ApiDeleteResponse('Category', { summary: 'Delete category' })
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
