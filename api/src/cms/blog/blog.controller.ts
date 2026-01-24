import { GetUser } from '@/identity/auth/decorators/get-user.decorator';
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { CloudinaryService } from '@/platform/integrations/external/cloudinary/cloudinary.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

/**
 * =====================================================================
 * BLOG CONTROLLER - QUẢN LÝ BÀI VIẾT (TIN TỨC)
 * =====================================================================
 *
 * =====================================================================
 */
@ApiTags('Admin - Blogs')
@Controller(['blogs', 'blog'])
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('blog:create')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiCreateResponse('Blog', { summary: 'Tạo bài viết mới' })
  async create(
    @Body() createBlogDto: CreateBlogDto,
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.blogService.create(createBlogDto, user.id);
  }

  @Get('my-blogs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiListResponse('Blog', { summary: 'Lấy bài viết của tôi' })
  async findMyBlogs(@GetUser() user: User) {
    const result = await this.blogService.findAll({
      userId: user.id,
      status: 'all',
      limit: 100,
    });
    return result;
  }

  @Get()
  @ApiListResponse('Blog', { summary: 'Lấy tất cả bài viết' })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'language', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('language') language?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.blogService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      category,
      language,
      status, // Default 'published' handled in service if undefined
      search,
    });
    return result; // Already returns { data, meta }
  }

  @Patch(':id/toggle-publish')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('blog:update')
  @ApiBearerAuth()
  @ApiUpdateResponse('Blog', { summary: 'Bật/tắt trạng thái hiển thị' })
  async togglePublish(@Param('id') id: string) {
    return this.blogService.togglePublish(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lấy thống kê danh mục bài viết' })
  async getCategoryStats() {
    return this.blogService.getCategoryStats();
  }

  @Get('category-stats')
  @ApiOperation({ summary: 'Lấy thống kê danh mục bài viết (Alias)' })
  async getCategoryStatsAlias() {
    return this.blogService.getCategoryStats();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê bài viết (Alias cho categories)' })
  async getStats() {
    return this.blogService.getCategoryStats();
  }

  @Get(':id')
  @ApiGetOneResponse('Blog', { summary: 'Lấy chi tiết bài viết' })
  async findOne(@Param('id') id: string) {
    const data = await this.blogService.findOne(id);
    if (!data) {
      throw new NotFoundException('Blog không tồn tại');
    }
    return data;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('blog:update')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiUpdateResponse('Blog', { summary: 'Cập nhật bài viết' })
  async update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.blogService.update(id, updateBlogDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('blog:delete')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiDeleteResponse('Blog', { summary: 'Xóa bài viết' })
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return this.blogService.remove(id, user);
  }
}
