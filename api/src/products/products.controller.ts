/**
 * =====================================================================
 * PRODUCTS CONTROLLER - Điều khiển Sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Controller này xử lý tất cả các request liên quan đến Sản phẩm.
 * Sản phẩm ở đây là "Product Base" (sản phẩm gốc), VD: "iPhone 15 Pro Max".
 * Mỗi Product có thể có nhiều biến thể (SKU), VD: "Đen - 256GB", "Trắng - 512GB".
 *
 * PHÂN QUYỀN:
 * - GET endpoints: Ai cũng có thể truy cập (Public)
 * - POST/PATCH/DELETE: Chỉ Admin có quyền (product:create, product:update, product:delete)
 *
 * CÁC CHỨC NĂNG:
 * 1. Tạo sản phẩm mới (POST /products)
 * 2. Lấy danh sách sản phẩm có filter (GET /products)
 * 3. Lấy chi tiết sản phẩm (GET /products/:id)
 * 4. Cập nhật sản phẩm (PATCH /products/:id)
 * 5. Xóa sản phẩm - Soft delete (DELETE /products/:id)
 * 6. Lấy thông tin SKUs cho Guest Cart (POST /products/skus/details)
 * =====================================================================
 */

import { PermissionsGuard } from '@/auth/permissions.guard';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
  Cached,
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

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly exportService: ProductsExportService,
    private readonly importService: ProductsImportService,
  ) {}

  /**
   * Tạo sản phẩm mới.
   * Auto-generate SKUs dựa trên Options được cung cấp.
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:create')
  @ApiCreateResponse('Product', { summary: 'Tạo sản phẩm mới (Admin)' })
  async create(@Body() createProductDto: CreateProductDto) {
    const data = await this.productsService.create(createProductDto);
    return { data };
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
  findAll(@Query() query: FilterProductDto) {
    return this.productsService.findAll(query);
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
    const data = await this.productsService.semanticSearch(
      query,
      Number(limit) || 10,
    );
    return { data };
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
    const data = await this.productsService.findOne(id);
    return { data };
  }

  /**
   * Lấy danh sách sản phẩm liên quan.
   */
  @Get(':id/related')
  @Cached(300000)
  @ApiListResponse('Product', { summary: 'Lấy danh sách sản phẩm liên quan' })
  async getRelated(@Param('id') id: string) {
    const data = await this.productsService.getRelatedProducts(id);
    return { data };
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
    const data = await this.productsService.update(id, updateProductDto);
    return { data };
  }

  /**
   * Xóa sản phẩm (Soft Delete).
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:delete')
  @ApiDeleteResponse('Product', { summary: 'Xóa sản phẩm (Admin)' })
  async remove(@Param('id') id: string) {
    const data = await this.productsService.remove(id);
    return { data };
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
    const data = await this.productsService.getSkusByIds(body.skuIds);
    return { data };
  }

  @Get(':id/translations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:read')
  @ApiListResponse('any', { summary: 'Lấy bản dịch sản phẩm' })
  async getTranslations(@Param('id') id: string) {
    const data = await this.productsService.getTranslations(id);
    return { data };
  }

  @Post(':id/translations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:update')
  @ApiCreateResponse('any', { summary: 'Dịch thông tin sản phẩm' })
  async translate(
    @Param('id') id: string,
    @Body() body: { locale: string; name: string; description?: string },
  ) {
    const data = await this.productsService.translate(id, body);
    return { data };
  }

  /**
   * Export danh sách sản phẩm & SKUs ra file Excel.
   */
  @Get('export/excel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('product:read')
  @ApiOperation({ summary: 'Export Products & SKUs to Excel' })
  async export(@Res() res: Response) {
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
    const data = await this.importService.importFromExcel(file);
    return { data };
  }
}
