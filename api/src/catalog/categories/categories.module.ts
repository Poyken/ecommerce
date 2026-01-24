import { PrismaModule } from '@core/prisma/prisma.module';
import { CloudinaryModule } from '@integrations/cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';
import { TenantsModule } from '@/identity/tenants/tenants.module';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoriesExportService } from './categories-export.service';
import { CategoriesImportService } from './categories-import.service';

// Use Cases
import {
  CreateCategoryUseCase,
  ListCategoriesUseCase,
  GetCategoryUseCase,
  UpdateCategoryUseCase,
  DeleteCategoryUseCase,
} from '../application/use-cases/categories';

// Interface Tokens
import {
  CATEGORY_REPOSITORY,
  PRODUCT_REPOSITORY,
} from '../domain/repositories';

// Implementations
import {
  PrismaCategoryRepository,
  PrismaProductRepository,
} from '../infrastructure/repositories';

@Module({
  imports: [PrismaModule, CloudinaryModule, TenantsModule],
  controllers: [CategoriesController],
  providers: [
    // Legacy Services
    CategoriesService,
    CategoriesExportService,
    CategoriesImportService,

    // Use Cases
    CreateCategoryUseCase,
    ListCategoriesUseCase,
    GetCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,

    // Repositories
    PrismaCategoryRepository,
    PrismaProductRepository,
    {
      provide: CATEGORY_REPOSITORY,
      useClass: PrismaCategoryRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
  ],
  exports: [CategoriesService],
})
export class CategoriesModule {}
