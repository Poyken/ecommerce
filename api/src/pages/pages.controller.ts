import { Permissions } from '@/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PagesService } from './pages.service';

@ApiTags('Pages')
@Controller('pages')
@ApiTags('Pages')
@Controller('pages')
/**
 * =================================================================================================
 * PAGES CONTROLLER - QUẢN LÝ CÁC TRANG TĨNH (CMS)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HYBRID API (PUBLIC & PRIVATE):
 *    - Controller này phục vụ 2 đối tượng:
 *      A. Khách vãng lai (Public): Xem nội dung trang (`getPage`, `getTranslations`). KHÔNG cần đăng nhập.
 *      B. Admin (Private): Tạo/Sửa/Xóa trang (`admin/*`). CẦN đăng nhập + Permission.
 *
 * 2. ROUTING ĐỘNG (DYNAMIC SLUG):
 *    - `@Get(':slug')` cho phép bắt mọi đường dẫn như `/about`, `/contact`, `/shipping-policy`.
 *    - Lưu ý: Endpoint này nên đặt cuối cùng hoặc cẩn thận để không "ăn" mất các route khác.
 * =================================================================================================
 */
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // --- PUBLIC ---

  @Get(':slug')
  @ApiOperation({ summary: 'Get public page by slug' })
  async getPage(@Param('slug') slug: string) {
    // SECURITY: Prevent catch-all from matching static files or technical paths
    if (
      slug.includes('.') ||
      slug.includes('_next') ||
      slug === 'favicon.ico'
    ) {
      throw new NotFoundException('Static asset requested via CMS route');
    }

    const lookupSlug = slug === 'home' ? '/' : `/${slug}`;
    const page = await this.pagesService.findBySlug(lookupSlug);
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  @Get('translations/:locale')
  @ApiOperation({ summary: 'Get translations for a locale' })
  async getTranslations(@Param('locale') locale: string) {
    return this.pagesService.getTranslations(locale);
  }

  // --- ADMIN ---

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('page:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: List all pages' })
  async findAll() {
    return this.pagesService.findAll();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('page:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get page by ID' })
  async findById(@Param('id') id: string) {
    return this.pagesService.findById(id);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('page:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Create new page' })
  async create(@Body() data: any) {
    return this.pagesService.create(data);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('page:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update existing page' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.pagesService.update(id, data);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('page:delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete page' })
  async delete(@Param('id') id: string) {
    return this.pagesService.delete(id);
  }
}
