/**
 * =====================================================================
 * BRAND MAPPER - Infrastructure Layer
 * =====================================================================
 */

import { Brand as PrismaBrand } from '@prisma/client';
import {
  Brand as BrandEntity,
  BrandProps,
} from '../../domain/entities/brand.entity';
import { Slug } from '@core/domain/value-objects/slug.vo';

export class BrandMapper {
  static toDomain(prismaBrand: PrismaBrand): BrandEntity {
    const props: BrandProps = {
      id: prismaBrand.id,
      tenantId: prismaBrand.tenantId,
      name: prismaBrand.name,
      slug: Slug.create(prismaBrand.slug),
      imageUrl: prismaBrand.imageUrl ?? undefined,
      createdAt: prismaBrand.createdAt,
      updatedAt: prismaBrand.updatedAt,
      deletedAt: prismaBrand.deletedAt ?? undefined,
    };

    return BrandEntity.fromPersistence(props);
  }

  static toPersistence(brand: BrandEntity): any {
    return {
      id: brand.id,
      tenantId: brand.tenantId,
      name: brand.name,
      slug: brand.slug.value,
      imageUrl: brand.imageUrl,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
      deletedAt: brand.deletedAt,
    };
  }

  static toDomainList(prismaBrands: PrismaBrand[]): BrandEntity[] {
    return prismaBrands.map((b) => this.toDomain(b));
  }
}
