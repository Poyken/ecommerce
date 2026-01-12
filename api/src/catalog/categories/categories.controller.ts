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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Product Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('category:create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiCreateResponse('Category', { summary: 'Create new category' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      createCategoryDto.imageUrl = result.secure_url;
    }
    const data = await this.categoriesService.create(createCategoryDto);
    return { data };
  }

  @Get()
  @Cached(300) // Cache 5 phút (300s)
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

  @Get(':id')
  @ApiGetOneResponse('Category', { summary: 'Get category details' })
  async findOne(@Param('id') id: string) {
    const data = await this.categoriesService.findOne(id);
    return { data };
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
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      updateCategoryDto.imageUrl = result.secure_url;
    }
    const data = await this.categoriesService.update(id, updateCategoryDto);
    return { data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('category:delete')
  @ApiDeleteResponse('Category', { summary: 'Delete category' })
  async remove(@Param('id') id: string) {
    const data = await this.categoriesService.remove(id);
    return { data };
  }
}
