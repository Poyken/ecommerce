import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';

/**
 * =====================================================================
 * WISHLIST CONTROLLER - QUẢN LÝ DANH SÁCH YÊU THÍCH
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TOGGLE PATTERN (Cơ chế bật/tắt):
 * - Thay vì có 2 API add và remove, ta dùng 1 API `toggle`.
 * - Nếu sản phẩm chưa có -> Thêm vào. Nếu có rồi -> Xóa đi.
 * - Giúp frontend xử lý UI nút "Tim" đơn giản hơn.
 *
 * 2. MERGE WISHLIST (Hợp nhất dữ liệu):
 * - Khi khách hàng vãng lai (Guest) đăng nhập, ta gọi API `merge` để đưa các sản phẩm họ đã thích ở Client vào tài khoản chính thức trong DB.
 * =====================================================================
 */
@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle wishlist (Add/Remove)' })
  async toggle(@Req() req, @Body('productId') productId: string) {
    const data = await this.wishlistService.toggle(req.user.id, productId);
    return { data };
  }

  @Get('count')
  @ApiOperation({ summary: 'Get wishlist items count' })
  async count(@Req() req) {
    const data = await this.wishlistService.count(req.user.id);
    return { data };
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách yêu thích' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const data = await this.wishlistService.findAll(
      req.user.id,
      Number(page),
      Number(limit),
    );
    return data; // Service returns { data, meta }
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if product is wishlisted' })
  async checkStatus(@Req() req, @Query('productId') productId: string) {
    const data = await this.wishlistService.checkStatus(req.user.id, productId);
    return { data };
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge guest wishlist into user account' })
  async mergeWishlist(@Req() req, @Body('productIds') productIds: string[]) {
    const data = await this.wishlistService.mergeWishlist(
      req.user.id,
      productIds,
    );
    return { data };
  }
}
