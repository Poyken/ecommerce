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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { WishlistService } from './wishlist.service';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle wishlist (Add/Remove)' })
  toggle(@Req() req, @Body('productId') productId: string) {
    return this.wishlistService.toggle(req.user.id, productId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get wishlist items count' })
  count(@Req() req) {
    return this.wishlistService.count(req.user.id);
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
    return this.wishlistService.findAll(
      req.user.id,
      Number(page),
      Number(limit),
    );
  }

  @Get('check')
  @ApiOperation({ summary: 'Check if product is wishlisted' })
  checkStatus(@Req() req, @Query('productId') productId: string) {
    return this.wishlistService.checkStatus(req.user.id, productId);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge guest wishlist into user account' })
  mergeWishlist(@Req() req, @Body('productIds') productIds: string[]) {
    return this.wishlistService.mergeWishlist(req.user.id, productIds);
  }
}
