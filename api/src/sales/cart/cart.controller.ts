/**
 * =====================================================================
 * CART CONTROLLER - Điều khiển Giỏ hàng
 * =====================================================================
 *
 * =====================================================================
 */

import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import {
  ApiCreateResponse,
  ApiDeleteResponse,
  ApiGetOneResponse,
  ApiUpdateResponse,
} from '@/common/decorators/crud.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithUser } from '@/identity/auth/interfaces/request-with-user.interface';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('Shopping Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard) // Bảo vệ tất cả route - Yêu cầu JWT Token hợp lệ
@ApiBearerAuth() // Hiển thị nút nhập Token trên Swagger UI
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Lấy thông tin giỏ hàng của user hiện tại.
   * Trả về danh sách items, tổng tiền và tổng số lượng.
   */
  @Get()
  @ApiGetOneResponse('Cart', {
    summary: 'Lấy giỏ hàng của người dùng hiện tại',
  })
  async getCart(@Request() req: RequestWithUser) {
    return this.cartService.getCart(req.user.id);
  }

  /**
   * Thêm sản phẩm (SKU) vào giỏ hàng.
   * Nếu SKU đã có trong giỏ → Cộng dồn số lượng.
   */
  @Post()
  @ApiCreateResponse('CartItem', { summary: 'Thêm sản phẩm vào giỏ hàng' })
  async addToCart(@Request() req: RequestWithUser, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, dto);
  }

  /**
   * Cập nhật số lượng của một item trong giỏ.
   * Được gọi khi user tăng/giảm số lượng ở trang giỏ hàng.
   */
  @Patch('items/:id')
  @ApiUpdateResponse('CartItem', {
    summary: 'Cập nhật số lượng sản phẩm trong giỏ',
  })
  async updateItem(
    @Request() req: RequestWithUser,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(req.user.id, itemId, dto);
  }

  /**
   * Xóa một item khỏi giỏ hàng.
   */
  @Delete('items/:id')
  @ApiDeleteResponse('CartItem', { summary: 'Xóa một sản phẩm khỏi giỏ hàng' })
  async removeItem(
    @Request() req: RequestWithUser,
    @Param('id') itemId: string,
  ) {
    return this.cartService.removeItem(req.user.id, itemId);
  }

  /**
   * Xóa toàn bộ giỏ hàng (Clear Cart).
   */
  @Delete()
  @ApiDeleteResponse('Cart', { summary: 'Xóa toàn bộ giỏ hàng' })
  async clearCart(@Request() req: RequestWithUser) {
    return this.cartService.clearCart(req.user.id);
  }

  /**
   * Gộp giỏ hàng của Guest vào tài khoản User sau khi đăng nhập.
   *
   * FLOW:
   * 1. User chưa đăng nhập → Thêm sản phẩm vào localStorage (Guest Cart)
   * 2. User đăng nhập → Frontend gọi API này để merge vào DB
   * 3. Service xử lý từng item: check tồn kho, cộng dồn nếu trùng SKU
   */
  @Post('merge')
  @ApiCreateResponse('Cart', {
    summary: 'Gộp giỏ hàng guest vào tài khoản user',
  })
  async mergeCart(
    @Request() req: RequestWithUser,
    @Body() items: { skuId: string; quantity: number }[],
  ) {
    return this.cartService.mergeCart(req.user.id, items);
  }
}
