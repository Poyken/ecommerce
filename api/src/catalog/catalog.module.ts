import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { BrandsModule } from './brands/brands.module';
import { ProductsModule } from './products/products.module';
import { SkusModule } from './skus/skus.module';

/**
 * =====================================================================
 * CATALOG MODULE - Quản lý Danh mục & Sản phẩm
 * =====================================================================
 *
 * =====================================================================
 */

@Module({
  imports: [CategoriesModule, BrandsModule, ProductsModule, SkusModule],
  exports: [CategoriesModule, BrandsModule, ProductsModule, SkusModule],
})
export class CatalogModule {}
