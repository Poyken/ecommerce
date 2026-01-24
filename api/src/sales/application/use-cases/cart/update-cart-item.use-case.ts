import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '../../../domain/repositories/cart.repository.interface';
import {
  ISkuRepository,
  SKU_REPOSITORY,
} from '@/catalog/domain/repositories/sku.repository.interface';
import { Cart } from '../../../domain/entities/cart.entity';

export interface UpdateCartItemInput {
  userId: string;
  itemId: string;
  quantity: number;
}

export type UpdateCartItemOutput = {
  cart: Cart;
};

@Injectable()
export class UpdateCartItemUseCase extends CommandUseCase<
  UpdateCartItemInput,
  UpdateCartItemOutput
> {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    @Inject(SKU_REPOSITORY)
    private readonly skuRepository: ISkuRepository,
  ) {
    super();
  }

  async execute(
    input: UpdateCartItemInput,
  ): Promise<Result<UpdateCartItemOutput, any>> {
    const { userId, itemId, quantity } = input;

    try {
      const cart = await this.cartRepository.findByCustomer(userId);
      if (!cart) {
        return Result.fail(new NotFoundException('Giỏ hàng không tồn tại'));
      }

      // Find by item ID instead of SKU ID for precision
      const item = cart.items.find((i) => i.id === itemId);
      if (!item) {
        return Result.fail(
          new NotFoundException('Sản phẩm không có trong giỏ hàng'),
        );
      }

      const skuId = item.skuId;

      // Validate stock
      const sku = await this.skuRepository.findById(skuId);
      if (!sku) {
        return Result.fail(
          new NotFoundException('Sản phẩm (SKU) không tồn tại'),
        );
      }

      if (sku.stock < quantity) {
        return Result.fail(
          new BadRequestException(
            `Không đủ hàng trong kho. Còn lại: ${sku.stock}`,
          ),
        );
      }

      // Update quantity using SKU ID as internal identifier in the entity
      cart.updateItemQuantity(skuId, quantity, sku.stock);

      // Save
      const savedCart = await this.cartRepository.save(cart);

      return Result.ok({ cart: savedCart });
    } catch (error) {
      return Result.fail(error);
    }
  }
}
