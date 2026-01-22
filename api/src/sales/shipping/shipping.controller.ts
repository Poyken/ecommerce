import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiGetOneResponse,
  ApiListResponse,
} from '@/common/decorators/crud.decorators';
import { ShippingService } from './shipping.service';

/**
 * =====================================================================
 * SHIPPING CONTROLLER - API GIAO HÀNG & WEBHOOK
 * =====================================================================
 *
 * =====================================================================
 */
@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  /**
   * =====================================================================
   * SHIPPING CONTROLLER - Vận chuyển & Địa chính
   * =====================================================================
   *
   * =====================================================================
   */
  constructor(private readonly shippingService: ShippingService) {}

  @Get('provinces')
  @ApiListResponse('Province', { summary: 'Lấy danh sách Tỉnh/Thành phố' })
  async getProvinces() {
    return this.shippingService.getProvinces();
  }

  @Get('districts/:provinceId')
  @ApiListResponse('District', {
    summary: 'Lấy danh sách Quận/Huyện theo Tỉnh',
  })
  async getDistricts(@Param('provinceId') provinceId: string) {
    return this.shippingService.getDistricts(Number(provinceId));
  }

  @Get('wards/:districtId')
  @ApiListResponse('Ward', { summary: 'Lấy danh sách Phường/Xã theo Quận' })
  async getWards(@Param('districtId') districtId: string) {
    return this.shippingService.getWards(Number(districtId));
  }

  @Post('fee')
  @ApiGetOneResponse('Shipping Fee', { summary: 'Tính phí vận chuyển' })
  async calculateFee(@Body() body: { districtId: number; wardCode: string }) {
    return this.shippingService.calculateFee(body.districtId, body.wardCode);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'GHN Webhook - Tự động cập nhật trạng thái' })
  handleWebhook(@Body() body: Record<string, any>) {
    return this.shippingService.handleGHNWebhook(body);
  }
}
