import { PrismaModule } from '@core/prisma/prisma.module';
import { CloudinaryModule } from '@integrations/cloudinary/cloudinary.module';
import { Module } from '@nestjs/common';
import { TenantsModule } from '@/identity/tenants/tenants.module';

import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { BrandsExportService } from './brands-export.service';
import { BrandsImportService } from './brands-import.service';

// Use Cases
import {
  CreateBrandUseCase,
  ListBrandsUseCase,
  GetBrandUseCase,
  UpdateBrandUseCase,
  DeleteBrandUseCase,
} from '../application/use-cases/brands';

// Interface Tokens
import { BRAND_REPOSITORY, PRODUCT_REPOSITORY } from '../domain/repositories';

// Implementations
import {
  PrismaBrandRepository,
  PrismaProductRepository,
} from '../infrastructure/repositories';

@Module({
  imports: [PrismaModule, CloudinaryModule, TenantsModule],
  controllers: [BrandsController],
  providers: [
    // Legacy Services
    BrandsService,
    BrandsExportService,
    BrandsImportService,

    // Use Cases
    CreateBrandUseCase,
    ListBrandsUseCase,
    GetBrandUseCase,
    UpdateBrandUseCase,
    DeleteBrandUseCase,

    // Repositories
    PrismaBrandRepository,
    PrismaProductRepository,
    {
      provide: BRAND_REPOSITORY,
      useClass: PrismaBrandRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
  ],
  exports: [BrandsService],
})
export class BrandsModule {}
