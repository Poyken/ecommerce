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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

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
  /**
   * =====================================================================
   * COUPONS CONTROLLER - Quản lý mã giảm giá
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. VALIDATION LOGIC:
   * - API `/validate` (Public) được gọi khi user nhấn "Áp dụng" ở trang Checkout.
   * - Nó kiểm tra: Mã tồn tại? Còn hạn? Đủ điều kiện giá trị đơn hàng tối thiểu? Còn lượt dùng?
   *
   * 2. ADMIN MANAGEMENT:
   * - Các API CRUD (Create/Update/Delete) yêu cầu quyền Admin để quản lý chiến dịch khuyến mãi.
   * =====================================================================
   */
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('coupon:create')
  @ApiOperation({ summary: 'Create a new discount coupon (Admin)' })
  async create(@Body() createCouponDto: CreateCouponDto) {
    const data = await this.couponsService.create(createCouponDto);
    return { data };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('coupon:read')
  @ApiOperation({ summary: 'Get all coupons (Admin)' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.couponsService.findAll(Number(page), Number(limit));
  }

  @Get('validate')
  @ApiOperation({ summary: 'Validate a coupon code' })
  async validate(@Query('code') code: string, @Query('amount') amount: number) {
    const data = await this.couponsService.validateCoupon(code, Number(amount));
    return { data };
  }

  /**
   * Get available public coupons - Cached for 5 minutes
   * Data ít thay đổi, cache để giảm tải database
   */
  @Get('available')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes
  @ApiOperation({ summary: 'Get available public coupons' })
  async findAvailable() {
    const data = await this.couponsService.findAvailable();
    return { data };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('coupon:read')
  @ApiOperation({ summary: 'Get coupon details by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.couponsService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('coupon:update')
  @ApiOperation({ summary: 'Update coupon information' })
  async update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    const data = await this.couponsService.update(id, updateCouponDto);
    return { data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('coupon:delete')
  @ApiOperation({ summary: 'Delete a coupon (Hard Delete)' })
  async remove(@Param('id') id: string) {
    const data = await this.couponsService.remove(id);
    return { data };
  }
}
