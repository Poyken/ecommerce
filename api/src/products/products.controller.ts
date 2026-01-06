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

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
   * Yêu cầu quyền: product:create
   *
   * Auto-generate SKUs dựa trên Options được cung cấp.
   * VD: Options = [Màu: Đen, Trắng] + [Size: S, M] → 4 SKUs
   */
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('product:create')
  @ApiOperation({ summary: 'Tạo sản phẩm mới (Admin)' })
  async create(@Body() createProductDto: CreateProductDto) {
    const data = await this.productsService.create(createProductDto);
    return { data };
  }

  /**
   * Lấy danh sách sản phẩm với bộ lọc.
   * Public API - Dùng cho trang Danh sách sản phẩm (PLP).
   *
   * Hỗ trợ: search, categoryId, brandId, minPrice, maxPrice, sort, pagination
   * 🚀 CACHED: 2 minutes TTL
   */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(120000) // 2 minutes
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm (có phân trang & lọc)' })
  findAll(@Query() query: FilterProductDto) {
    return this.productsService.findAll(query);
  }

  /**
   * Semantic Search - Tìm kiếm theo ngữ nghĩa.
   * Public API - Tìm sản phẩm dựa trên ý nghĩa câu hỏi (không chỉ keyword).
   * VD: "áo ấm cho mùa đông" sẽ tìm thấy "Áo Khoác Parka" dù không có từ khớp.
   */
  @Get('semantic-search')
  @ApiOperation({ summary: 'Tìm kiếm sản phẩm bằng AI (Semantic Search)' })
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
   *
   * Trả về: Thông tin product, Options, và tất cả SKUs biến thể.
   *
   * Đã kích hoạt Caching (Redis) - TTL 5 phút.
   */
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm' })
  async findOne(@Param('id') id: string) {
    const data = await this.productsService.findOne(id);
    return { data };
  }

  /**
   * Lấy danh sách sản phẩm liên quan.
   * Public API - Dùng cho trang PDP để suggest sản phẩm khác.
   */
  @Get(':id/related')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm liên quan' })
  async getRelated(@Param('id') id: string) {
    const data = await this.productsService.getRelatedProducts(id);
    return { data };
  }

  /**
   * Cập nhật thông tin sản phẩm.
   * Yêu cầu quyền: product:update
   *
   * Lưu ý: Nếu cập nhật Options, SKUs sẽ được tự động migrate
   * với chiến lược "Smart Migration" - Kế thừa price/stock từ biến thể cũ matching.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('product:update')
  @ApiOperation({ summary: 'Cập nhật sản phẩm (Admin)' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const data = await this.productsService.update(id, updateProductDto);
    return { data };
  }

  /**
   * Xóa sản phẩm (Soft Delete).
   * Yêu cầu quyền: product:delete
   *
   * Không xóa vĩnh viễn, chỉ đánh dấu deletedAt và deactivate các SKUs.
   * Dữ liệu vẫn còn trong DB để phục vụ báo cáo và lịch sử đơn hàng.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('product:delete')
  @ApiOperation({ summary: 'Xóa sản phẩm (Admin)' })
  async remove(@Param('id') id: string) {
    const data = await this.productsService.remove(id);
    return { data };
  }

  /**
   * Lấy thông tin chi tiết của nhiều SKUs cùng lúc.
   * Public API - Dùng cho Guest Cart.
   *
   * Guest Cart lưu trong localStorage chỉ có skuId + quantity.
   * Endpoint này giúp lấy thông tin hiển thị: tên, giá, ảnh, options.
   */
  @Post('skus/details')
  @ApiOperation({ summary: 'Lấy thông tin nhiều SKUs (cho Guest Cart)' })
  async getSkusDetails(@Body() body: { skuIds: string[] }) {
    const data = await this.productsService.getSkusByIds(body.skuIds);
    return { data };
  }
  @Get(':id/translations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('product:read')
  async getTranslations(@Param('id') id: string) {
    const data = await this.productsService.getTranslations(id);
    return { data };
  }

  @Post(':id/translations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('product:update')
  @ApiOperation({ summary: 'Dịch thông tin sản phẩm' })
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
  @ApiBearerAuth()
  @Permissions('product:read')
  @ApiOperation({ summary: 'Export Products & SKUs to Excel' })
  async export(@Res() res: Response) {
    return this.exportService.exportToExcel(res);
  }

  /**
   * Import sản phẩm & SKUs từ file Excel.
   */
  @Post('import/excel')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('product:create')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import Products & SKUs from Excel' })
  async import(@UploadedFile() file: Express.Multer.File) {
    const data = await this.importService.importFromExcel(file);
    return { data };
  }
}
