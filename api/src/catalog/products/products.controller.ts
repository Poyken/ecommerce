/**
 * =====================================================================
 * PRODUCTS CONTROLLER - Điều khiển Sản phẩm
 * =====================================================================
 *
 * =====================================================================
 */

import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  Cached,
  Public,
  RequirePermissions,
} from '@/common/decorators/crud.decorators';
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
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsExportService } from './products-export.service';
import { ProductsImportService } from './products-import.service';
import { ProductsService } from './products.service';
import { BulkUpdateSkusDto } from './dto/bulk-update-skus.dto';
import { Req } from '@nestjs/common';
import { CreateProductUseCase } from '@/catalog/application/use-cases/products/create-product.use-case';
import { GetProductUseCase } from '@/catalog/application/use-cases/products/get-product.use-case';
import { UpdateProductUseCase } from '@/catalog/application/use-cases/products/update-product.use-case';
import { DeleteProductUseCase } from '@/catalog/application/use-cases/products/delete-product.use-case';
import { ListProductsUseCase } from '@/catalog/application/use-cases/products/list-products.use-case';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductMapper } from '@/catalog/infrastructure/mappers/product.mapper';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly exportService: ProductsExportService,
    private readonly importService: ProductsImportService,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  /**
   * Tạo sản phẩm mới.
   * Auto-generate SKUs dựa trên Options được cung cấp.
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:create')
  @ApiCreateResponse('Product', { summary: 'Tạo sản phẩm mới (Admin)' })
  async create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant ID missing');

    const result = await this.createProductUseCase.execute({
      ...createProductDto,
      tenantId,
      categoryIds: createProductDto.categoryIds || [], // Ensure array
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return ProductMapper.toPersistence(result.value.product); // Returning legacy format for now
  }

  /**
   * Lấy danh sách sản phẩm với bộ lọc.
   * Public API - Dùng cho trang Danh sách sản phẩm (PLP).
   * 🚀 CACHED: 2 minutes TTL
   */
  @Get()
  @Cached(120000)
  @ApiListResponse('Product', {
    summary: 'Lấy danh sách sản phẩm (có phân trang & lọc)',
  })
  async findAll(@Query() query: FilterProductDto, @Req() req: any) {
    // For public endpoints, try to get tenant from domain/headers if not authenticated
    // But for now assume a default or extracted from request
    const tenantId =
      req.user?.tenantId || req.headers['x-tenant-id'] || 'default'; // Simplification

    const result = await this.listProductsUseCase.execute({
      tenantId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      categoryId: query.categoryId,
      brandId: query.brandId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sortBy: query.sort as any,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return {
      data: result.value.products.data.map((p) =>
        ProductMapper.toPersistence(p),
      ),
      meta: result.value.products.meta,
    };
  }

  /**
   * Semantic Search - Tìm kiếm theo ngữ nghĩa.
   * Public API.
   */
  @Get('semantic-search')
  @ApiListResponse('Product', {
    summary: 'Tìm kiếm sản phẩm bằng AI (Semantic Search)',
  })
  async semanticSearch(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.semanticSearch(query, Number(limit) || 10);
  }

  /**
   * Lấy chi tiết sản phẩm.
   * Public API - Dùng cho trang Chi tiết sản phẩm (PDP).
   * Đã kích hoạt Caching (Redis) - TTL 5 phút.
   */
  @Get(':id')
  @Cached(300000)
  @ApiGetOneResponse('Product', { summary: 'Lấy chi tiết sản phẩm' })
  async findOne(@Param('id') id: string) {
    const result = await this.getProductUseCase.execute({ productId: id });

    if (result.isFailure) {
      throw new NotFoundException(result.error.message);
    }

    return ProductMapper.toPersistence(result.value.product);
  }

  /**
   * Lấy danh sách sản phẩm liên quan.
   */
  @Get(':id/related')
  @Cached(300000)
  @ApiListResponse('Product', { summary: 'Lấy danh sách sản phẩm liên quan' })
  async getRelated(@Param('id') id: string) {
    return this.productsService.getRelatedProducts(id);
  }

  /**
   * Cập nhật thông tin sản phẩm.
   * Lưu ý: Smart Migration cho SKUs.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:update')
  @ApiUpdateResponse('Product', { summary: 'Cập nhật sản phẩm (Admin)' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const result = await this.updateProductUseCase.execute({
      productId: id,
      ...updateProductDto,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return ProductMapper.toPersistence(result.value.product);
  }

  /**
   * Cập nhật đồng thời nhiều SKUs của sản phẩm.
   */
  @Patch(':id/skus/bulk')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:update')
  @ApiUpdateResponse('any', { summary: 'Cập nhật hàng loạt SKU (Admin)' })
  async bulkUpdateSkus(
    @Param('id') id: string,
    @Body() body: BulkUpdateSkusDto,
  ) {
    return this.productsService.bulkUpdateSkus(id, body.skus);
  }

  /**
   * Xóa sản phẩm (Soft Delete).
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:delete')
  @ApiDeleteResponse('Product', { summary: 'Xóa sản phẩm (Admin)' })
  async remove(@Param('id') id: string) {
    const result = await this.deleteProductUseCase.execute({ productId: id });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return { success: true };
  }

  /**
   * Lấy thông tin chi tiết của nhiều SKUs cùng lúc.
   * Public API - Dùng cho Guest Cart.
   */
  @Post('skus/details')
  @ApiListResponse('Sku', {
    summary: 'Lấy thông tin nhiều SKUs (cho Guest Cart)',
  })
  async getSkusDetails(@Body() body: { skuIds: string[] }) {
    return this.productsService.getSkusByIds(body.skuIds);
  }

  @Get(':id/translations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:read')
  @ApiListResponse('any', { summary: 'Lấy bản dịch sản phẩm' })
  async getTranslations(@Param('id') id: string) {
    return this.productsService.getTranslations(id);
  }

  @Post(':id/translations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:update')
  @ApiCreateResponse('any', { summary: 'Dịch thông tin sản phẩm' })
  async translate(
    @Param('id') id: string,
    @Body() body: { locale: string; name: string; description?: string },
  ) {
    return this.productsService.translate(id, body);
  }

  /**
   * Export danh sách sản phẩm & SKUs ra file Excel.
   */
  @Get('export/excel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:read')
  @ApiOperation({ summary: 'Export Products & SKUs to Excel' })
  async export(@Res() res: any) {
    return this.exportService.exportToExcel(res);
  }

  /**
   * Import sản phẩm & SKUs từ file Excel.
   */
  @Post('import/excel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiCreateResponse('any', { summary: 'Import Products & SKUs from Excel' })
  async import(@UploadedFile() file: Express.Multer.File) {
    return this.importService.importFromExcel(file);
  }

  /**
   * Xem trước dữ liệu import.
   */
  @Post('import/preview')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Preview Products import from Excel' })
  async preview(@UploadedFile() file: Express.Multer.File) {
    return this.importService.previewFromExcel(file);
  }

  /**
   * Tải xuống mẫu file Excel import.
   */
  @Get('import/template')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:create')
  @ApiOperation({ summary: 'Download Import Template' })
  async downloadTemplate(@Res() res: any) {
    return this.importService.generateTemplate(res);
  }
}
