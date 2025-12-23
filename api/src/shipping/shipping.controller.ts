import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Lấy danh sách Tỉnh/Thành phố' })
  getProvinces() {
    return this.shippingService.getProvinces();
  }

  @Get('districts/:provinceId')
  @ApiOperation({ summary: 'Lấy danh sách Quận/Huyện theo Tỉnh' })
  getDistricts(@Param('provinceId') provinceId: string) {
    return this.shippingService.getDistricts(Number(provinceId));
  }

  @Get('wards/:districtId')
  @ApiOperation({ summary: 'Lấy danh sách Phường/Xã theo Quận' })
  getWards(@Param('districtId') districtId: string) {
    return this.shippingService.getWards(Number(districtId));
  }

  @Post('fee')
  @ApiOperation({ summary: 'Tính phí vận chuyển' })
  calculateFee(@Body() body: { districtId: number; wardCode: string }) {
    return this.shippingService.calculateFee(body.districtId, body.wardCode);
  }
}
