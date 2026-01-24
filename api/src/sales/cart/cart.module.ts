import { Module } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

// Repository
import { CART_REPOSITORY } from '../domain/repositories/cart.repository.interface';
import { PrismaCartRepository } from '../infrastructure/repositories/prisma-cart.repository';
import { SKU_REPOSITORY } from '@/catalog/domain/repositories/sku.repository.interface';
import { SkusModule } from '@/catalog/skus/skus.module';

import {
  GetCartUseCase,
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveCartItemUseCase,
  MergeCartUseCase,
  ClearCartUseCase,
} from '../application/use-cases';
import { OrderEventsHandler } from './application/handlers/order-events.handler';

@Module({
  imports: [PrismaModule, SkusModule],
  controllers: [CartController],
  providers: [
    OrderEventsHandler,
    CartService,
    PrismaCartRepository,
    {
      provide: CART_REPOSITORY,
      useClass: PrismaCartRepository,
    },
    // Use Cases
    GetCartUseCase,
    AddToCartUseCase,
    UpdateCartItemUseCase,
    RemoveCartItemUseCase,
    MergeCartUseCase,
    ClearCartUseCase,
  ],
  exports: [
    CartService,
    CART_REPOSITORY,
    GetCartUseCase,
    AddToCartUseCase,
    UpdateCartItemUseCase,
    RemoveCartItemUseCase,
    MergeCartUseCase,
    ClearCartUseCase,
  ],
})
export class CartModule {}
