import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '@core/prisma/prisma.module';
import { CloudinaryModule } from '@integrations/cloudinary/cloudinary.module';
import { ProductsModule } from '@/catalog/products/products.module';

import { SkusController } from './skus.controller';
import { SkusService } from './skus.service';

// Use Cases
import {
  CreateSkuUseCase,
  ListSkusUseCase,
  GetSkuUseCase,
  UpdateSkuUseCase,
  DeleteSkuUseCase,
} from '../application/use-cases/skus';

// Tokens
import { SKU_REPOSITORY, PRODUCT_REPOSITORY } from '../domain/repositories';

// Infrastructure
import {
  PrismaSkuRepository,
  PrismaProductRepository,
} from '../infrastructure/repositories';

@Module({
  imports: [PrismaModule, CloudinaryModule, forwardRef(() => ProductsModule)],
  controllers: [SkusController],
  providers: [
    // Legacy Service
    SkusService,

    // Use Cases
    CreateSkuUseCase,
    ListSkusUseCase,
    GetSkuUseCase,
    UpdateSkuUseCase,
    DeleteSkuUseCase,

    // Repositories
    PrismaSkuRepository,
    PrismaProductRepository,
    {
      provide: SKU_REPOSITORY,
      useClass: PrismaSkuRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
  ],
  exports: [
    SkusService,
    SKU_REPOSITORY,
    CreateSkuUseCase,
    ListSkusUseCase,
    GetSkuUseCase,
    UpdateSkuUseCase,
    DeleteSkuUseCase,
  ],
})
export class SkusModule {}
