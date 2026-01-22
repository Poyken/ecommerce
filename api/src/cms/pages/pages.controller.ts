import {
  RequirePermissions,
  ApiListResponse,
  ApiGetOneResponse,
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
} from '@/common/decorators/crud.decorators';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
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
 * =================================================================================================
 */
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // --- PUBLIC ---

  @Get()
  @ApiOperation({ summary: 'List all public pages' })
  async findAllPublic() {
    return this.pagesService.findAll();
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
    return page;
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
    return this.pagesService.getTranslations(locale);
  }

  // --- ADMIN ---

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('page:read')
  @ApiBearerAuth()
  @ApiListResponse('Page', { summary: 'Admin: List all pages' })
  async findAll() {
    return this.pagesService.findAll();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('page:read')
  @ApiBearerAuth()
  @ApiGetOneResponse('Page', { summary: 'Admin: Get page by ID' })
  async findById(@Param('id') id: string) {
    return this.pagesService.findById(id);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('page:create')
  @ApiBearerAuth()
  @ApiCreateResponse('Page', { summary: 'Admin: Create new page' })
  async create(@Body() data: any) {
    return this.pagesService.create(data);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('page:update')
  @ApiBearerAuth()
  @ApiUpdateResponse('Page', { summary: 'Admin: Update existing page' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.pagesService.update(id, data);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('page:delete')
  @ApiBearerAuth()
  @ApiDeleteResponse('Page', { summary: 'Admin: Delete page' })
  async delete(@Param('id') id: string) {
    return this.pagesService.delete(id);
  }
}
