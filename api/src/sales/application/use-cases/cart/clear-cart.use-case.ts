import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '../../../domain/repositories/cart.repository.interface';
import { Cart } from '../../../domain/entities/cart.entity';

export interface ClearCartInput {
  userId: string;
}

export type ClearCartOutput = { success: boolean };

@Injectable()
export class ClearCartUseCase extends CommandUseCase<
  ClearCartInput,
  ClearCartOutput
> {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
  ) {
    super();
  }

  async execute(input: ClearCartInput): Promise<Result<ClearCartOutput, any>> {
    const { userId } = input;

    try {
      const cart = await this.cartRepository.findByCustomer(userId);
      if (!cart) {
        return Result.ok({ success: true }); // Already empty/none
      }

      cart.clear();
      await this.cartRepository.save(cart);

      return Result.ok({ success: true });
    } catch (error) {
      return Result.fail(error);
    }
  }
}
