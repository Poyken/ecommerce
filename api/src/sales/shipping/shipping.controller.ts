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
import {
  GetShippingLocationUseCase,
  CalculateShippingFeeUseCase,
  LocationType,
} from './application/use-cases';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(
    private readonly shippingService: ShippingService,
    private readonly getShippingLocationUseCase: GetShippingLocationUseCase,
    private readonly calculateShippingFeeUseCase: CalculateShippingFeeUseCase,
  ) {}

  @Get('provinces')
  @ApiListResponse('Province', { summary: 'Lấy danh sách Tỉnh/Thành phố' })
  async getProvinces() {
    const result = await this.getShippingLocationUseCase.execute({
      type: LocationType.PROVINCE,
    });
    if (result.isFailure) throw result.error;
    return result.value;
  }

  @Get('districts/:provinceId')
  @ApiListResponse('District', {
    summary: 'Lấy danh sách Quận/Huyện theo Tỉnh',
  })
  async getDistricts(@Param('provinceId') provinceId: string) {
    const result = await this.getShippingLocationUseCase.execute({
      type: LocationType.DISTRICT,
      parentId: Number(provinceId),
    });
    if (result.isFailure) throw result.error;
    return result.value;
  }

  @Get('wards/:districtId')
  @ApiListResponse('Ward', { summary: 'Lấy danh sách Phường/Xã theo Quận' })
  async getWards(@Param('districtId') districtId: string) {
    const result = await this.getShippingLocationUseCase.execute({
      type: LocationType.WARD,
      parentId: Number(districtId),
    });
    if (result.isFailure) throw result.error;
    return result.value;
  }

  @Post('fee')
  @ApiGetOneResponse('Shipping Fee', { summary: 'Tính phí vận chuyển' })
  async calculateFee(@Body() body: { districtId: number; wardCode: string }) {
    const result = await this.calculateShippingFeeUseCase.execute({
      toDistrictId: body.districtId,
      toWardCode: body.wardCode,
    });
    if (result.isFailure) throw result.error;
    return result.value;
  }

  @Post('webhook')
  @ApiOperation({ summary: 'GHN Webhook - Tự động cập nhật trạng thái' })
  handleWebhook(@Body() body: Record<string, any>) {
    return this.shippingService.handleGHNWebhook(body);
  }
}
