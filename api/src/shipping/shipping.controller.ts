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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ĐỊA CHÍNH (Geo-location):
 * - Cung cấp API để frontend lấy danh sách Tỉnh/Huyện/Xã chuẩn từ đối tác GHN.
 * - Giúp user chọn địa chỉ chính xác, tránh việc nhập tay sai sót.
 *
 * 2. WEBHOOK (CỰC KỲ QUAN TRỌNG):
 * - Khi trạng thái đơn hàng thay đổi trên hệ thống GHN (Đang giao, Đã giao...), GHN sẽ gọi vào API `/webhook` này.
 * - Hệ thống tự động cập nhật trạng thái đơn hàng trong DB mà không cần Admin phải làm thủ công.
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
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. PROXY PATTERN:
   * - Các API này (provinces, districts...) thực chất là gọi sang Services của Giao Hàng Nhanh (GHN) hoặc GHTK.
   * - Backend ta đóng vai trò Proxy để ẩn API Key của đối tác và cache lại dữ liệu địa chính (ít thay đổi) để giảm tải.
   * =====================================================================
   */
  constructor(private readonly shippingService: ShippingService) {}

  @Get('provinces')
  @ApiListResponse('Province', { summary: 'Lấy danh sách Tỉnh/Thành phố' })
  async getProvinces() {
    const data = await this.shippingService.getProvinces();
    return { data };
  }

  @Get('districts/:provinceId')
  @ApiListResponse('District', {
    summary: 'Lấy danh sách Quận/Huyện theo Tỉnh',
  })
  async getDistricts(@Param('provinceId') provinceId: string) {
    const data = await this.shippingService.getDistricts(Number(provinceId));
    return { data };
  }

  @Get('wards/:districtId')
  @ApiListResponse('Ward', { summary: 'Lấy danh sách Phường/Xã theo Quận' })
  async getWards(@Param('districtId') districtId: string) {
    const data = await this.shippingService.getWards(Number(districtId));
    return { data };
  }

  @Post('fee')
  @ApiGetOneResponse('Shipping Fee', { summary: 'Tính phí vận chuyển' })
  async calculateFee(@Body() body: { districtId: number; wardCode: string }) {
    const data = await this.shippingService.calculateFee(
      body.districtId,
      body.wardCode,
    );
    return { data };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'GHN Webhook - Tự động cập nhật trạng thái' })
  handleWebhook(@Body() body: Record<string, any>) {
    return this.shippingService.handleGHNWebhook(body);
  }
}
