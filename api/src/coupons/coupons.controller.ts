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
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

/**
 * =====================================================================
 * COUPONS CONTROLLER - QUẢN LÝ MÃ GIẢM GIÁ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COUPON VALIDATION (Kiểm tra mã):
 * - API `/validate` được Frontend gọi liên tục khi khách hàng nhập mã giảm giá.
 * - Nó kiểm tra: Mã có tồn tại không? Còn hạn không? Có đủ điều kiện giá trị đơn hàng tối thiểu không?
 *
 * 2. PUBLIC vs PRIVATE:
 * - `available`: Trả về danh sách mã giảm giá công khai mà ai cũng thấy. Được CACHE 5 phút để tối ưu hiệu năng.
 * - Các hàm CRUD khác: Chỉ Admin mới có quyền thực hiện.
 * =====================================================================
 */
@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('coupon:create')
  @ApiCreateResponse('Coupon', {
    summary: 'Create a new discount coupon (Admin)',
  })
  async create(@Body() createCouponDto: CreateCouponDto) {
    const data = await this.couponsService.create(createCouponDto);
    return { data };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('coupon:read')
  @ApiListResponse('Coupon', { summary: 'Get all coupons (Admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.couponsService.findAll(Number(page), Number(limit));
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate a coupon code' })
  @ApiGetOneResponse('Coupon')
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'amount', required: true })
  async validate(@Query('code') code: string, @Query('amount') amount: number) {
    const data = await this.couponsService.validateCoupon(code, Number(amount));
    return { data };
  }

  /**
   * Get available public coupons - Cached for 5 minutes
   * Data ít thay đổi, cache để giảm tải database
   */
  @Get('available')
  @Cached(300) // 5 minutes (300 seconds)
  @ApiListResponse('Coupon', { summary: 'Get available public coupons' })
  async findAvailable() {
    const data = await this.couponsService.findAvailable();
    return { data };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('coupon:read')
  @ApiGetOneResponse('Coupon', { summary: 'Get coupon details by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.couponsService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('coupon:update')
  @ApiUpdateResponse('Coupon', { summary: 'Update coupon information' })
  async update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    const data = await this.couponsService.update(id, updateCouponDto);
    return { data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('coupon:delete')
  @ApiDeleteResponse('Coupon', { summary: 'Delete a coupon (Hard Delete)' })
  async remove(@Param('id') id: string) {
    const data = await this.couponsService.remove(id);
    return { data };
  }
}
