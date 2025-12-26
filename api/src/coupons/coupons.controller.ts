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

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
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
