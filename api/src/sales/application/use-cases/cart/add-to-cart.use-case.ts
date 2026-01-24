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

export interface AddToCartInput {
  userId: string;
  tenantId: string;
  skuId: string;
  quantity: number;
}

export type AddToCartOutput = {
  cart: Cart;
  capped: boolean;
};

@Injectable()
export class AddToCartUseCase extends CommandUseCase<
  AddToCartInput,
  AddToCartOutput
> {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    @Inject(SKU_REPOSITORY)
    private readonly skuRepository: ISkuRepository,
  ) {
    super();
  }

  async execute(input: AddToCartInput): Promise<Result<AddToCartOutput, any>> {
    const { userId, tenantId, skuId, quantity } = input;

    try {
      // 1. Validate SKU
      const sku = await this.skuRepository.findById(skuId);
      if (!sku) {
        return Result.fail(
          new NotFoundException('Sản phẩm (SKU) không tồn tại'),
        );
      }

      if (sku.status !== 'ACTIVE') {
        return Result.fail(
          new BadRequestException('Sản phẩm không còn được bán'),
        );
      }

      if (sku.stock < quantity) {
        return Result.fail(
          new BadRequestException(
            `Không đủ hàng trong kho. Còn lại: ${sku.stock}`,
          ),
        );
      }

      // 2. Fetch or Create Cart
      const cart = await this.cartRepository.findOrCreateForCustomer(
        tenantId,
        userId,
      );

      // 3. Add item logic (using Domain Entity)
      // Cart entity should have addItem method
      const capped = cart.addItem(
        {
          id: '',
          skuId: sku.id,
          productId: sku.productId,
          productName: sku.productName || '',
          skuCode: sku.skuCode,
          variantLabel: sku.variantLabel || '',
          imageUrl: sku.imageUrl,
          unitPrice: sku.price,
        },
        quantity,
        sku.stock,
      );

      // 4. Save
      const savedCart = await this.cartRepository.save(cart);

      return Result.ok({
        cart: savedCart,
        capped,
      });
    } catch (error) {
      return Result.fail(error);
    }
  }
}
