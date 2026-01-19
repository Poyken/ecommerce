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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CORE DOMAIN:
 * - Đây là "Trái tim" của một hệ thống Ecommerce. Quản lý cây danh mục, thương hiệu và sản phẩm.
 * - Giúp code sạch hơn bằng cách gom nhóm bộ 4 module cơ bản (Categories, Brands, Products, Skus).
 *
 * 2. HIERARCHY:
 * - Categories connect to Products, Brands connect to Products.
 * - Products have multiple SKUs (Biến thể).
 *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Hiển thị menu danh mục, bộ lọc thương hiệu và chi tiết sản phẩm trên website.
 *
 * =====================================================================
 */

@Module({
  imports: [CategoriesModule, BrandsModule, ProductsModule, SkusModule],
  exports: [CategoriesModule, BrandsModule, ProductsModule, SkusModule],
})
export class CatalogModule {}
