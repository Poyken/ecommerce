/**
 * =====================================================================
 * CATEGORIES CONTROLLER
 * =====================================================================
 */
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
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
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { getTenant } from '@core/tenant/tenant.context';

// Use Cases
import { CreateCategoryUseCase } from '@/catalog/application/use-cases/categories/create-category.use-case';
import { ListCategoriesUseCase } from '@/catalog/application/use-cases/categories/list-categories.use-case';
import { GetCategoryUseCase } from '@/catalog/application/use-cases/categories/get-category.use-case';
import { UpdateCategoryUseCase } from '@/catalog/application/use-cases/categories/update-category.use-case';
import { DeleteCategoryUseCase } from '@/catalog/application/use-cases/categories/delete-category.use-case';

import { CategoryMapper } from '@/catalog/infrastructure/mappers/category.mapper';

import { CategoriesExportService } from './categories-export.service';
import { CategoriesImportService } from './categories-import.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly exportService: CategoriesExportService,
    private readonly importService: CategoriesImportService,
    // Injected Use Cases
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly getCategoryUseCase: GetCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiCreateResponse('Category', { summary: 'Tạo danh mục mới (Admin)' })
  async create(
    @Req() req: any,
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID missing');

    let imageUrl = createCategoryDto.imageUrl;
    if (file) {
      const uploadResult = await this.cloudinaryService
        .uploadImage(file)
        .catch(() => null);
      if (uploadResult?.url) imageUrl = uploadResult.url;
    }

    const result = await this.createCategoryUseCase.execute({
      ...createCategoryDto,
      tenantId,
      imageUrl,
    });

    if (result.isFailure) {
      const error = result.error;
      if (error.constructor.name === 'BusinessRuleViolationError') {
        throw new ConflictException(error.message);
      }
      if (error.constructor.name === 'EntityNotFoundError') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    return CategoryMapper.toPersistence(result.value.category);
  }

  @Get()
  @ApiListResponse('Category', {
    summary: 'Get all categories',
  })
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 100,
  ) {
    const contextTenant = getTenant();
    const tenantIdAttr = req.user?.tenantId || contextTenant?.id;

    if (!tenantIdAttr) {
      // Allow public, but need tenantId.
      // If no tenant implies public? Domain/Entities enforce tenantId.
      // So error.
      throw new BadRequestException('Tenant Context missing');
    }

    const result = await this.listCategoriesUseCase.execute({
      tenantId: tenantIdAttr,
      page: Number(page),
      limit: Number(limit),
      search,
    });

    if (result.isFailure) throw new BadRequestException(result.error);

    return {
      data: result.value.categories.data.map((c) =>
        CategoryMapper.toPersistence(c),
      ),
      meta: result.value.categories.meta,
    };
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
  async findOne(@Req() req: any, @Param('id') id: string) {
    const contextTenant = getTenant();
    const tenantId = req.user?.tenantId || contextTenant?.id;

    const result = await this.getCategoryUseCase.execute({ id, tenantId });
    if (result.isFailure) throw new NotFoundException(result.error.message);
    return CategoryMapper.toPersistence(result.value.category);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('category:update')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiUpdateResponse('Category', { summary: 'Update category' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID missing');

    let imageUrl = updateCategoryDto.imageUrl;
    if (file) {
      const uploadResult = await this.cloudinaryService
        .uploadImage(file)
        .catch(() => null);
      if (uploadResult?.url) imageUrl = uploadResult.url;
    }

    const result = await this.updateCategoryUseCase.execute({
      ...updateCategoryDto,
      id,
      tenantId,
      imageUrl,
      parentId:
        updateCategoryDto.parentId === '' ? null : updateCategoryDto.parentId,
    });

    if (result.isFailure) {
      const error = result.error;
      if (error.constructor.name === 'EntityNotFoundError')
        throw new NotFoundException(error.message);
      if (error.constructor.name === 'BusinessRuleViolationError')
        throw new ConflictException(error.message);
      throw new BadRequestException(error.message);
    }
    return CategoryMapper.toPersistence(result.value.category);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('category:delete')
  @ApiDeleteResponse('Category', { summary: 'Delete category' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID missing');

    const result = await this.deleteCategoryUseCase.execute({ id, tenantId });
    if (result.isFailure) {
      const error = result.error;
      if (error.constructor.name === 'EntityNotFoundError')
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }
}
