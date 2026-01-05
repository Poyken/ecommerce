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
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  // --- PUBLIC ---

  @Get(':slug')
  @ApiOperation({ summary: 'Get public page by slug' })
  async getPage(@Param('slug') slug: string) {
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
