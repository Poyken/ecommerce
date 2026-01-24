import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '../../../domain/repositories/cart.repository.interface';
import { Cart } from '../../../domain/entities/cart.entity';

export interface RemoveCartItemInput {
  userId: string;
  itemId: string;
}

export type RemoveCartItemOutput = {
  cart: Cart;
};

@Injectable()
export class RemoveCartItemUseCase extends CommandUseCase<
  RemoveCartItemInput,
  RemoveCartItemOutput
> {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
  ) {
    super();
  }

  async execute(
    input: RemoveCartItemInput,
  ): Promise<Result<RemoveCartItemOutput, any>> {
    const { userId, itemId } = input;

    try {
      const cart = await this.cartRepository.findByCustomer(userId);
      if (!cart) {
        return Result.fail(new NotFoundException('Giỏ hàng không tồn tại'));
      }

      // Find SKU ID from Item ID
      const item = cart.items.find((i) => i.id === itemId);
      if (!item) {
        return Result.fail(
          new NotFoundException('Sản phẩm không có trong giỏ hàng'),
        );
      }

      cart.removeItem(item.skuId);

      const savedCart = await this.cartRepository.save(cart);

      return Result.ok({ cart: savedCart });
    } catch (error) {
      return Result.fail(error);
    }
  }
}
