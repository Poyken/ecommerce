import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
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

/**
 * =====================================================================
 * CATEGORIES CONTROLLER - Điều hướng yêu cầu về danh mục sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ACCESS CONTROL (RBAC):
 * - `create`, `update`, `remove` (Admin): Yêu cầu quyền cụ thể (VD: `category:create`) để đảm bảo chỉ Admin mới có thể thay đổi cấu trúc danh mục.
 * - `findAll`, `findOne` (Public): Cho phép mọi người truy cập để xem danh sách sản phẩm theo danh mục.
 *
 * 2. SWAGGER INTEGRATION:
 * - `@ApiTags('Product Categories')`: Giúp phân loại các API này vào nhóm "Danh mục sản phẩm" trên trang tài liệu `/docs`.
 * - `@ApiOperation`: Mô tả ngắn gọn chức năng của từng API cho các lập trình viên khác dễ hiểu.
 *
 * 3. QUERY PARAMETERS:
 * - `findAll(@Query('search'))`: Hỗ trợ tìm kiếm danh mục theo từ khóa ngay từ URL.
 *
 * 4. CACHING:
 * - GET /categories được cache 5 phút để giảm tải database cho dữ liệu ít thay đổi.
 * =====================================================================
 */
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { CloudinaryService } from '@integrations/cloudinary/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiBearerAuth()
  @Permissions('category:create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create new category' })
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
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // Cache 5 phút (300,000ms)
  @ApiOperation({ summary: 'Get all categories (cached 5 mins)' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 100,
  ) {
    const data = await this.categoriesService.findAll(
      search,
      Number(page),
      Number(limit),
    );
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category details' })
  async findOne(@Param('id') id: string) {
    const data = await this.categoriesService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('category:update')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update category' })
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
  @ApiBearerAuth()
  @Permissions('category:delete')
  @ApiOperation({ summary: 'Delete category' })
  async remove(@Param('id') id: string) {
    const data = await this.categoriesService.remove(id);
    return { data };
  }
}
