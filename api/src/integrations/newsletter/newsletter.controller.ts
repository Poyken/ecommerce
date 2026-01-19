import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * =====================================================================
 * NEWSLETTER CONTROLLER - Điều hướng yêu cầu đăng ký bản tin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PUBLIC API:
 * - API đăng ký bản tin thường là công khai (Public), không yêu cầu đăng nhập.
 * - Cho phép cả khách vãng lai để lại email để nhận thông tin khuyến mãi.
 *
 * 2. HTTP STATUS CODES:
 * - `@HttpCode(HttpStatus.OK)`: Mặc định POST trả về 201 (Created), nhưng ở đây ta dùng 200 (OK) vì hành động này giống như một yêu cầu xử lý hơn là tạo mới một tài nguyên phức tạp. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, validate dữ liệu và điều phối xử lý logic thông qua các Service tương ứng.

 * =====================================================================
 */
import { SubscribeDto } from './dto/subscribe.dto';
import { NewsletterService } from './newsletter.service';

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng ký nhận bản tin' })
  @ApiResponse({ status: 200, description: 'Đăng ký thành công.' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto.email);
  }
}
