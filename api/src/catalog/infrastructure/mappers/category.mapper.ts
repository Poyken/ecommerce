/**
 * =====================================================================
 * CATEGORY MAPPER - Infrastructure Layer
 * =====================================================================
 */

import { Category, Category as PrismaCategory } from '@prisma/client';
import {
  Category as CategoryEntity,
  CategoryProps,
} from '../../domain/entities/category.entity';
import { Slug } from '@core/domain/value-objects/slug.vo';

type PrismaCategoryWithCount = PrismaCategory & {
  _count?: {
    products: number;
  };
};

export class CategoryMapper {
  static toDomain(prismaCategory: PrismaCategoryWithCount): CategoryEntity {
    const props: CategoryProps = {
      id: prismaCategory.id,
      tenantId: prismaCategory.tenantId,
      name: prismaCategory.name,
      slug: Slug.create(prismaCategory.slug),
      imageUrl: prismaCategory.imageUrl ?? undefined,
      parentId: prismaCategory.parentId ?? undefined,
      productCount: prismaCategory._count?.products ?? 0,
      createdAt: prismaCategory.createdAt,
      updatedAt: prismaCategory.updatedAt,
      deletedAt: prismaCategory.deletedAt ?? undefined,
    };

    return CategoryEntity.fromPersistence(props);
  }

  static toPersistence(category: CategoryEntity): any {
    return {
      id: category.id,
      tenantId: category.tenantId,
      name: category.name,
      slug: category.slug.value,
      imageUrl: category.imageUrl,
      parentId: category.parentId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      deletedAt: category.deletedAt,
    };
  }

  static toDomainList(
    prismaCategories: PrismaCategoryWithCount[],
  ): CategoryEntity[] {
    return prismaCategories.map((c) => this.toDomain(c));
  }
}
