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
import { Permissions } from '@/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('coupon:create')
  async create(@Body() createCouponDto: CreateCouponDto) {
    const data = await this.couponsService.create(createCouponDto);
    return { data };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('coupon:read')
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.couponsService.findAll(Number(page), Number(limit));
  }

  @Get('validate')
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
  async findAvailable() {
    const data = await this.couponsService.findAvailable();
    return { data };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('coupon:read')
  async findOne(@Param('id') id: string) {
    const data = await this.couponsService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('coupon:update')
  async update(
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    const data = await this.couponsService.update(id, updateCouponDto);
    return { data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('coupon:delete')
  async remove(@Param('id') id: string) {
    const data = await this.couponsService.remove(id);
    return { data };
  }
}
