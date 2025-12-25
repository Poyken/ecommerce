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
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@ApiTags('blogs')
@Controller('blogs')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new blog post' })
  async create(
    @Body() createBlogDto: CreateBlogDto,
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file, 'blogs');
      createBlogDto.image = (result as any).secure_url;
    }
    const data = await this.blogService.create(createBlogDto, user.id);
    return { data };
  }

  @Get('my-blogs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user blogs' })
  async findMyBlogs(@GetUser() user: User) {
    const result = await this.blogService.findAll({
      userId: user.id,
      status: 'all',
      limit: 100, // Reasonable limit for profile
    });
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get all published blog posts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
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
  @Permissions('blog:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle publish status (Admin only)' })
  async togglePublish(@Param('id') id: string) {
    const data = await this.blogService.togglePublish(id);
    return { data };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get blog category statistics' })
  async getCategoryStats() {
    const data = await this.blogService.getCategoryStats();
    return { data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single blog post by ID or slug' })
  async findOne(@Param('id') id: string) {
    const data = await this.blogService.findOne(id);
    if (!data) {
      throw new Error('Blog not found');
    }
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a blog post' })
  async update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,

    @GetUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file, 'blogs');
      updateBlogDto.image = (result as any).secure_url;
    }
    const data = await this.blogService.update(id, updateBlogDto, user);
    return { data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a blog post' })
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.blogService.remove(id, user);
  }
}
