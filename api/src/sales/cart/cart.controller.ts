/**
 * =====================================================================
 * CART CONTROLLER - Điều khiển Giỏ hàng
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
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { RequestWithUser } from '@/identity/auth/interfaces/request-with-user.interface';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { getTenant } from '@core/tenant/tenant.context';

// Use Cases
import {
  GetCartUseCase,
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveCartItemUseCase,
  MergeCartUseCase,
  ClearCartUseCase,
} from '../application/use-cases';

@ApiTags('Shopping Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(
    private readonly getCartUseCase: GetCartUseCase,
    private readonly addToCartUseCase: AddToCartUseCase,
    private readonly updateCartItemUseCase: UpdateCartItemUseCase,
    private readonly removeCartItemUseCase: RemoveCartItemUseCase,
    private readonly mergeCartUseCase: MergeCartUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
  ) {}

  @Get()
  @ApiGetOneResponse('Cart', {
    summary: 'Lấy giỏ hàng của người dùng hiện tại',
  })
  async getCart(@Request() req: RequestWithUser) {
    const tenant = getTenant();
    const result = await this.getCartUseCase.execute({
      userId: req.user.id,
      tenantId: tenant?.id || '',
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return result.value;
  }

  @Post()
  @ApiCreateResponse('CartItem', { summary: 'Thêm sản phẩm vào giỏ hàng' })
  async addToCart(@Request() req: RequestWithUser, @Body() dto: AddToCartDto) {
    const tenant = getTenant();
    const result = await this.addToCartUseCase.execute({
      userId: req.user.id,
      tenantId: tenant?.id || '',
      ...dto,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return result.value;
  }

  @Patch('items/:id')
  @ApiUpdateResponse('CartItem', {
    summary: 'Cập nhật số lượng sản phẩm trong giỏ',
  })
  async updateItem(
    @Request() req: RequestWithUser,
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const result = await this.updateCartItemUseCase.execute({
      userId: req.user.id,
      itemId,
      ...dto,
    });

    if (result.isFailure) {
      return this.handleError(result.error);
    }

    return result.value;
  }

  @Delete('items/:id')
  @ApiDeleteResponse('CartItem', { summary: 'Xóa một sản phẩm khỏi giỏ hàng' })
  async removeItem(
    @Request() req: RequestWithUser,
    @Param('id') itemId: string,
  ) {
    const result = await this.removeCartItemUseCase.execute({
      userId: req.user.id,
      itemId,
    });

    if (result.isFailure) {
      return this.handleError(result.error);
    }

    return result.value;
  }

  @Delete()
  @ApiDeleteResponse('Cart', { summary: 'Xóa toàn bộ giỏ hàng' })
  async clearCart(@Request() req: RequestWithUser) {
    const result = await this.clearCartUseCase.execute({
      userId: req.user.id,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return result.value;
  }

  @Post('merge')
  @ApiCreateResponse('Cart', {
    summary: 'Gộp giỏ hàng guest vào tài khoản user',
  })
  async mergeCart(
    @Request() req: RequestWithUser,
    @Body() items: { skuId: string; quantity: number }[],
  ) {
    const tenant = getTenant();
    const result = await this.mergeCartUseCase.execute({
      userId: req.user.id,
      tenantId: tenant?.id || '',
      items,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return result.value;
  }

  private handleError(error: any): never {
    if (
      error.name === 'EntityNotFoundError' ||
      error instanceof NotFoundException
    ) {
      throw new NotFoundException(error.message);
    }
    throw new BadRequestException(error.message);
  }
}
