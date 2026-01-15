import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Get,
  Query,
  UseGuards,
  Param,
  Patch,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import {
  ValidatePromotionDto,
  ApplyPromotionDto,
} from './dto/validate-promotion.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { GetUser } from '@/auth/decorators/get-user.decorator';

/**
 * =====================================================================
 * PROMOTIONS CONTROLLER - QUẢN LÝ KHUYẾN MÃI
 * =====================================================================
 *
 * Module quản lý các chương trình khuyến mãi, mã giảm giá.
 * Hỗ trợ rule-based engine với nhiều loại điều kiện và hành động.
 *
 * =====================================================================
 */
@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PROMOTION_CREATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo chương trình khuyến mãi mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc mã đã tồn tại',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền' })
  async create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PROMOTION_READ')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách chương trình khuyến mãi' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Trang (mặc định: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số lượng/trang (mặc định: 20)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm theo tên hoặc mã',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: String,
    description: 'Lọc theo trạng thái (true/false)',
  })
  @ApiResponse({ status: 200, description: 'Danh sách khuyến mãi' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.promotionsService.findAll({
      page,
      limit,
      search,
      isActive: isActive ? isActive === 'true' : undefined,
    });
  }

  @Get('available')
  @ApiOperation({
    summary: 'Lấy danh sách khuyến mãi đang có hiệu lực (cho storefront)',
  })
  @ApiQuery({
    name: 'totalAmount',
    required: false,
    type: String,
    description: 'Tổng giá trị đơn hàng để lọc',
  })
  @ApiResponse({ status: 200, description: 'Danh sách khuyến mãi khả dụng' })
  async getAvailable(
    @Query('totalAmount') totalAmount?: string,
    @GetUser('id') userId?: string,
  ) {
    return this.promotionsService.getAvailablePromotions({
      totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
      userId,
    });
  }

  @Post('validate')
  @ApiOperation({ summary: 'Kiểm tra mã khuyến mãi với giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Kết quả kiểm tra (valid, discountAmount, ...)',
  })
  @ApiResponse({
    status: 400,
    description: 'Mã không hợp lệ hoặc không thỏa điều kiện',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy mã khuyến mãi' })
  async validate(@Body() dto: ValidatePromotionDto) {
    return this.promotionsService.validatePromotion(dto);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Áp dụng mã khuyến mãi vào đơn hàng' })
  @ApiResponse({ status: 200, description: 'Áp dụng thành công' })
  @ApiResponse({ status: 400, description: 'Không thể áp dụng' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async apply(@Body() dto: ApplyPromotionDto, @GetUser('id') userId: string) {
    return this.promotionsService.applyPromotion({
      ...dto,
      userId,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PROMOTION_READ')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy chi tiết chương trình khuyến mãi' })
  @ApiParam({ name: 'id', description: 'ID khuyến mãi' })
  @ApiResponse({ status: 200, description: 'Chi tiết khuyến mãi' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PROMOTION_READ')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thống kê sử dụng khuyến mãi' })
  @ApiParam({ name: 'id', description: 'ID khuyến mãi' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê (totalUsages, totalDiscount, ...)',
  })
  async getStats(@Param('id') id: string) {
    return this.promotionsService.getPromotionStats(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PROMOTION_UPDATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật chương trình khuyến mãi' })
  @ApiParam({ name: 'id', description: 'ID khuyến mãi' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PROMOTION_UPDATE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bật/Tắt chương trình khuyến mãi' })
  @ApiParam({ name: 'id', description: 'ID khuyến mãi' })
  @ApiResponse({ status: 200, description: 'Đổi trạng thái thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async toggleActive(@Param('id') id: string) {
    return this.promotionsService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('PROMOTION_DELETE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa chương trình khuyến mãi' })
  @ApiParam({ name: 'id', description: 'ID khuyến mãi' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({
    status: 400,
    description: 'Không thể xóa (đã có lượt sử dụng)',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  async remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
