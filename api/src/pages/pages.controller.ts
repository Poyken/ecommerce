import {
  RequirePermissions,
  ApiListResponse,
  ApiGetOneResponse,
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
} from '@/common/decorators/crud.decorators';
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

  @Get()
  @ApiOperation({ summary: 'List all public pages' })
  async findAllPublic() {
    const result = await this.pagesService.findAll();
    return { data: result };
  }

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
    return { data: page };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('page:create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alias for page creation' })
  async createAlias(@Body() data: any) {
    return this.create(data);
  }

  @Get('translations/:locale')
  @ApiOperation({ summary: 'Get translations for a locale' })
  async getTranslations(@Param('locale') locale: string) {
    const result = await this.pagesService.getTranslations(locale);
    return { data: result };
  }

  // --- ADMIN ---

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('page:read')
  @ApiBearerAuth()
  @ApiListResponse('Page', { summary: 'Admin: List all pages' })
  async findAll() {
    const result = await this.pagesService.findAll();
    return { data: result };
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('page:read')
  @ApiBearerAuth()
  @ApiGetOneResponse('Page', { summary: 'Admin: Get page by ID' })
  async findById(@Param('id') id: string) {
    const result = await this.pagesService.findById(id);
    return { data: result };
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('page:create')
  @ApiBearerAuth()
  @ApiCreateResponse('Page', { summary: 'Admin: Create new page' })
  async create(@Body() data: any) {
    const result = await this.pagesService.create(data);
    return { data: result };
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('page:update')
  @ApiBearerAuth()
  @ApiUpdateResponse('Page', { summary: 'Admin: Update existing page' })
  async update(@Param('id') id: string, @Body() data: any) {
    const result = await this.pagesService.update(id, data);
    return { data: result };
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('page:delete')
  @ApiBearerAuth()
  @ApiDeleteResponse('Page', { summary: 'Admin: Delete page' })
  async delete(@Param('id') id: string) {
    const result = await this.pagesService.delete(id);
    return { data: result };
  }
}
