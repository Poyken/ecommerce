/**
 * =====================================================================
 * SKUS CONTROLLER - Quản lý Biến thể sản phẩm (SKU)
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
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { getTenant } from '@core/tenant/tenant.context';

// Use Cases
import { CreateSkuUseCase } from '@/catalog/application/use-cases/skus/create-sku.use-case';
import { ListSkusUseCase } from '@/catalog/application/use-cases/skus/list-skus.use-case';
import { GetSkuUseCase } from '@/catalog/application/use-cases/skus/get-sku.use-case';
import { UpdateSkuUseCase } from '@/catalog/application/use-cases/skus/update-sku.use-case';
import { DeleteSkuUseCase } from '@/catalog/application/use-cases/skus/delete-sku.use-case';

import { SkuMapper } from '@/catalog/infrastructure/mappers/sku.mapper';
import { SkuStatus } from '../domain/entities/sku.entity';

import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';

@ApiTags('Product SKUs')
@Controller('skus')
export class SkusController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    // Use Cases
    private readonly createSkuUseCase: CreateSkuUseCase,
    private readonly listSkusUseCase: ListSkusUseCase,
    private readonly getSkuUseCase: GetSkuUseCase,
    private readonly updateSkuUseCase: UpdateSkuUseCase,
    private readonly deleteSkuUseCase: DeleteSkuUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiCreateResponse('Sku', { summary: 'Tạo SKU mới (Biến thể)' })
  async create(
    @Req() req: any,
    @Body() createSkuDto: CreateSkuDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID missing');

    let imageUrl = createSkuDto.imageUrl;
    if (file) {
      const uploadResult = await this.cloudinaryService
        .uploadImage(file)
        .catch(() => null);
      if (uploadResult?.url) imageUrl = uploadResult.url;
    }

    const result = await this.createSkuUseCase.execute({
      ...createSkuDto,
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

    return SkuMapper.toPersistence(result.value.sku);
  }

  @Get()
  @ApiListResponse('Sku', { summary: 'Lấy danh sách SKU' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
  })
  async findAll(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: SkuStatus,
    @Query('search') search?: string,
    @Query('stockLimit') stockLimit?: number,
    @Query('productId') productId?: string,
  ) {
    const contextTenant = getTenant();
    const tenantIdAttr = req.user?.tenantId || contextTenant?.id;

    if (!tenantIdAttr) {
      throw new BadRequestException('Tenant Context missing');
    }

    const result = await this.listSkusUseCase.execute({
      tenantId: tenantIdAttr,
      page: Number(page),
      limit: Number(limit),
      productId,
      status,
      search,
      stockLimit: stockLimit ? Number(stockLimit) : undefined,
    });

    if (result.isFailure) throw new BadRequestException(result.error);

    return {
      data: result.value.skus.data.map((s) => SkuMapper.toPersistence(s)),
      meta: result.value.skus.meta,
    };
  }

  @Get(':id')
  @ApiGetOneResponse('Sku', { summary: 'Lấy chi tiết SKU' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const contextTenant = getTenant();
    const tenantId = req.user?.tenantId || contextTenant?.id;

    const result = await this.getSkuUseCase.execute({ id, tenantId });
    if (result.isFailure) throw new NotFoundException(result.error.message);
    return SkuMapper.toPersistence(result.value.sku);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:update')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiUpdateResponse('Sku', {
    summary: 'Cập nhật thông tin SKU (Giá, Tồn kho...)',
  })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateSkuDto: UpdateSkuDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID missing');

    let imageUrl = updateSkuDto.imageUrl;
    if (file) {
      const uploadResult = await this.cloudinaryService
        .uploadImage(file)
        .catch(() => null);
      if (uploadResult?.url) imageUrl = uploadResult.url;
    }

    const result = await this.updateSkuUseCase.execute({
      ...updateSkuDto,
      status: updateSkuDto.status as any,
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

    return SkuMapper.toPersistence(result.value.sku);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:delete')
  @ApiDeleteResponse('Sku', { summary: 'Xóa SKU' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID missing');

    const result = await this.deleteSkuUseCase.execute({ id, tenantId });
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
