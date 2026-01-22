import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import {
  ApiCreateResponse,
  ApiGetOneResponse,
  ApiListResponse,
} from '@/common/decorators/crud.decorators';
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
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';

/**
 * =====================================================================
 * WISHLIST CONTROLLER - QUẢN LÝ DANH SÁCH YÊU THÍCH
 * =====================================================================
 *
 * =====================================================================
 */
@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('toggle')
  @ApiCreateResponse('Object', { summary: 'Toggle wishlist (Add/Remove)' })
  async toggle(@Req() req, @Body('productId') productId: string) {
    return this.wishlistService.toggle(req.user.id, productId);
  }

  @Get('count')
  @ApiGetOneResponse('Number', { summary: 'Get wishlist items count' })
  async count(@Req() req) {
    return this.wishlistService.count(req.user.id);
  }

  @Get()
  @ApiListResponse('Product', { summary: 'Lấy danh sách yêu thích' })
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
  @ApiGetOneResponse('Boolean', { summary: 'Check if product is wishlisted' })
  async checkStatus(@Req() req, @Query('productId') productId: string) {
    return this.wishlistService.checkStatus(req.user.id, productId);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge guest wishlist into user account' })
  @ApiCreateResponse('Product', { summary: 'Merge guest wishlist' })
  async mergeWishlist(@Req() req, @Body('productIds') productIds: string[]) {
    return this.wishlistService.mergeWishlist(req.user.id, productIds);
  }
}
