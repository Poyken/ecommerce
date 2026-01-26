/**
 * =====================================================================
 * PRODUCT MAPPER - Entity <-> Prisma Model Conversion
 * =====================================================================
 *
 * Clean Architecture: Infrastructure Layer
 *
 * Handles conversion between domain entities and Prisma database models.
 * This keeps the domain layer clean from persistence concerns.
 */

import {
  Product,
  ProductOption,
  ProductImage,
  ProductProps,
} from '../../domain/entities/product.entity';
import { Money } from '@core/domain/value-objects/money.vo';
import { Slug } from '@core/domain/value-objects/slug.vo';
import {
  Product as PrismaProduct,
  ProductOption as PrismaOption,
  ProductImage as PrismaImage,
  OptionValue as PrismaOptionValue,
} from '@prisma/client';
import { SkuMapper } from './sku.mapper';

// Prisma model with relations
type PrismaProductWithRelations = PrismaProduct & {
  options?: (PrismaOption & {
    values?: PrismaOptionValue[];
  })[];
  images?: PrismaImage[];
  categories?: { categoryId: string }[];
  skus?: any[]; // Allow any for relations
};

export class ProductMapper {
  /**
   * Convert Prisma model to Domain entity
   */
  static toDomain(prismaProduct: PrismaProductWithRelations): Product {
    const options: ProductOption[] = (prismaProduct.options ?? []).map(
      (opt) => ({
        id: opt.id,
        name: opt.name,
        displayOrder: opt.displayOrder ?? 0,
        values: (opt.values ?? []).map((val) => ({
          id: val.id,
          value: val.value,
          imageUrl: val.imageUrl ?? undefined,
        })),
      }),
    );

    const images: ProductImage[] = (prismaProduct.images ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? undefined,
      displayOrder: img.displayOrder,
    }));

    const categoryIds = (prismaProduct.categories ?? []).map(
      (c) => c.categoryId,
    );
    
    const skus = SkuMapper.toDomainList(prismaProduct.skus ?? []);

    const props: ProductProps = {
      id: prismaProduct.id,
      tenantId: prismaProduct.tenantId,
      name: prismaProduct.name,
      slug: Slug.create(prismaProduct.slug),
      description: prismaProduct.description ?? undefined,
      brandId: prismaProduct.brandId,
      categoryIds,
      minPrice: Money.create(
        prismaProduct.minPrice ? Number(prismaProduct.minPrice) : 0,
      ),
      maxPrice: Money.create(
        prismaProduct.maxPrice ? Number(prismaProduct.maxPrice) : 0,
      ),
      avgRating: prismaProduct.avgRating ? Number(prismaProduct.avgRating) : 0,
      reviewCount: prismaProduct.reviewCount ?? 0,
      images,
      options,
      skus,
      metadata: prismaProduct.metadata as Record<string, unknown> | undefined,
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
      deletedAt: prismaProduct.deletedAt ?? undefined,
    };

    return Product.fromPersistence(props);
  }

  /**
   * Convert Domain entity to Prisma create/update data
   */
  static toPersistence(product: Product): Record<string, unknown> {
    return {
      id: product.id,
      tenantId: product.tenantId,
      name: product.name,
      slug: product.slug.value,
      description: product.description,
      brandId: product.brandId,
      minPrice: product.minPrice.amount,
      maxPrice: product.maxPrice.amount,
      avgRating: product.avgRating,
      reviewCount: product.reviewCount,
      skus: product.skus.map(sku => SkuMapper.toPersistence(sku)),
      metadata: product.metadata,
      updatedAt: product.updatedAt,
      deletedAt: product.deletedAt,
    };
  }

  /**
   * Convert multiple Prisma models to domain entities
   */
  static toDomainList(prismaProducts: PrismaProductWithRelations[]): Product[] {
    return prismaProducts.map((p) => this.toDomain(p));
  }
}
