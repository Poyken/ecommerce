import { Injectable, Inject, Logger } from '@nestjs/common';
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

export interface MergeCartInput {
  userId: string;
  tenantId: string;
  items: { skuId: string; quantity: number }[];
}

export type MergeCartOutput = {
  cart: Cart;
};

@Injectable()
export class MergeCartUseCase extends CommandUseCase<
  MergeCartInput,
  MergeCartOutput
> {
  private readonly logger = new Logger(MergeCartUseCase.name);

  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    @Inject(SKU_REPOSITORY)
    private readonly skuRepository: ISkuRepository,
  ) {
    super();
  }

  async execute(input: MergeCartInput): Promise<Result<MergeCartOutput, any>> {
    const { userId, tenantId, items } = input;

    if (!items.length) {
      const cart = await this.cartRepository.findOrCreateForCustomer(
        tenantId,
        userId,
      );
      return Result.ok({ cart });
    }

    try {
      // 1. Fetch or Create Target Cart
      const cart = await this.cartRepository.findOrCreateForCustomer(
        tenantId,
        userId,
      );

      // 2. Fetch all SKUs in batch for validation
      const skuIds = items.map((i) => i.skuId);
      const skus = await this.skuRepository.findByIds(skuIds);
      const skuMap = new Map(skus.map((s) => [s.id, s]));

      // 3. Process each item
      for (const itemInput of items) {
        const sku = skuMap.get(itemInput.skuId);

        if (!sku || sku.status !== 'ACTIVE') {
          this.logger.warn(
            `Skipping SKU ${itemInput.skuId} during merge: not found or inactive`,
          );
          continue;
        }

        // Add to cart with stock validation
        cart.addItem(
          {
            id: '', // Mapper or repo handles ID
            skuId: sku.id,
            productId: sku.productId,
            productName: sku.productName || '',
            skuCode: sku.skuCode,
            variantLabel: sku.variantLabel || '',
            imageUrl: sku.imageUrl,
            unitPrice: sku.price,
          },
          itemInput.quantity,
          sku.stock,
        );
      }

      // 4. Save merged cart
      const savedCart = await this.cartRepository.save(cart);

      return Result.ok({ cart: savedCart });
    } catch (error) {
      this.logger.error('Error merging cart', error);
      return Result.fail(error);
    }
  }
}
