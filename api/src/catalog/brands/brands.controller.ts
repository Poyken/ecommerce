/**
 * =====================================================================
 * BRANDS CONTROLLER - Quản lý Thương hiệu
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
import { CreateBrandUseCase } from '@/catalog/application/use-cases/brands/create-brand.use-case';
import { ListBrandsUseCase } from '@/catalog/application/use-cases/brands/list-brands.use-case';
import { GetBrandUseCase } from '@/catalog/application/use-cases/brands/get-brand.use-case';
import { UpdateBrandUseCase } from '@/catalog/application/use-cases/brands/update-brand.use-case';
import { DeleteBrandUseCase } from '@/catalog/application/use-cases/brands/delete-brand.use-case';

import { BrandMapper } from '@/catalog/infrastructure/mappers/brand.mapper';

import { BrandsExportService } from './brands-export.service';
import { BrandsImportService } from './brands-import.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@ApiTags('Product Brands')
@Controller('brands')
export class BrandsController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly exportService: BrandsExportService,
    private readonly importService: BrandsImportService,
    // Use Cases
    private readonly createBrandUseCase: CreateBrandUseCase,
    private readonly listBrandsUseCase: ListBrandsUseCase,
    private readonly getBrandUseCase: GetBrandUseCase,
    private readonly updateBrandUseCase: UpdateBrandUseCase,
    private readonly deleteBrandUseCase: DeleteBrandUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiCreateResponse('Brand', { summary: 'Create new brand' })
  async create(
    @Req() req: any,
    @Body() createBrandDto: CreateBrandDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID missing');

    let imageUrl = createBrandDto.imageUrl;
    if (file) {
      const uploadResult = await this.cloudinaryService
        .uploadImage(file)
        .catch(() => null);
      if (uploadResult?.url) imageUrl = uploadResult.url;
    }

    const result = await this.createBrandUseCase.execute({
      ...createBrandDto,
      tenantId,
      imageUrl,
    });

    if (result.isFailure) {
      const error = result.error;
      if (error.constructor.name === 'BusinessRuleViolationError') {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    return BrandMapper.toPersistence(result.value.brand);
  }

  @Get()
  @ApiListResponse('Brand', { summary: 'Get all brands (cached 5 mins)' })
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const contextTenant = getTenant();
    const tenantIdAttr = req.user?.tenantId || contextTenant?.id;

    if (!tenantIdAttr) {
      throw new BadRequestException('Tenant Context missing');
    }

    const result = await this.listBrandsUseCase.execute({
      tenantId: tenantIdAttr,
      page: Number(page),
      limit: Number(limit),
      search,
    });

    if (result.isFailure) throw new BadRequestException(result.error);

    return {
      data: result.value.brands.data.map((b) => BrandMapper.toPersistence(b)),
      meta: result.value.brands.meta,
    };
  }

  @Get('export/excel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:read')
  @ApiOperation({ summary: 'Export Brands to Excel' })
  async export(@Res() res: any) {
    return this.exportService.exportToExcel(res);
  }

  @Post('import/excel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import Brands from Excel' })
  async import(@UploadedFile() file: Express.Multer.File) {
    return this.importService.importFromExcel(file);
  }

  @Post('import/preview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Preview Brands import' })
  async preview(@UploadedFile() file: Express.Multer.File) {
    return this.importService.previewFromExcel(file);
  }

  @Get('import/template')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:create')
  @ApiOperation({ summary: 'Download Brand Import Template' })
  async downloadTemplate(@Res() res: any) {
    return this.importService.generateTemplate(res);
  }

  @Get(':id')
  @ApiGetOneResponse('Brand', { summary: 'Get brand details' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const contextTenant = getTenant();
    const tenantId = req.user?.tenantId || contextTenant?.id;

    const result = await this.getBrandUseCase.execute({ id, tenantId });
    if (result.isFailure) throw new NotFoundException(result.error.message);
    return BrandMapper.toPersistence(result.value.brand);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:update')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiUpdateResponse('Brand', { summary: 'Update brand' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID missing');

    let imageUrl = updateBrandDto.imageUrl;
    if (file) {
      const uploadResult = await this.cloudinaryService
        .uploadImage(file)
        .catch(() => null);
      if (uploadResult?.url) imageUrl = uploadResult.url;
    }

    const result = await this.updateBrandUseCase.execute({
      ...updateBrandDto,
      id,
      tenantId,
      imageUrl,
    });

    if (result.isFailure) {
      const error = result.error;
      if (error.constructor.name === 'EntityNotFoundError') {
        throw new NotFoundException(error.message);
      }
      if (error.constructor.name === 'BusinessRuleViolationError') {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    return BrandMapper.toPersistence(result.value.brand);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('brand:delete')
  @ApiDeleteResponse('Brand', { summary: 'Delete brand' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID missing');

    const result = await this.deleteBrandUseCase.execute({ id, tenantId });
    if (result.isFailure) {
      const error = result.error;
      if (error.constructor.name === 'EntityNotFoundError') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
    return { success: true };
  }
}
