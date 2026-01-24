import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '../../../domain/repositories/cart.repository.interface';
import { Cart } from '../../../domain/entities/cart.entity';

export interface GetCartInput {
  userId: string;
  tenantId: string;
}

export type GetCartOutput = {
  cart: Cart;
  totalAmount: number;
  totalItems: number;
};

@Injectable()
export class GetCartUseCase extends QueryUseCase<GetCartInput, GetCartOutput> {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
  ) {
    super();
  }

  async execute(input: GetCartInput): Promise<Result<GetCartOutput, any>> {
    const { userId, tenantId } = input;

    try {
      // Tìm hoặc tạo mới nếu chưa có
      const cart = await this.cartRepository.findOrCreateForCustomer(
        tenantId,
        userId,
      );

      // Tính toán thông tin bổ sung (Totals)
      // Logic này có thể đưa vào entity Cart nếu muốn, nhưng Cart hiện tại là Aggregate Root
      // Entity Cart nên có method calculateTotals()

      const totalAmount = cart.items.reduce(
        (sum, item) => sum + item.unitPrice.amount * item.quantity,
        0,
      );

      const totalItems = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      return Result.ok({
        cart,
        totalAmount,
        totalItems,
      });
    } catch (error) {
      return Result.fail(error);
    }
  }
}
