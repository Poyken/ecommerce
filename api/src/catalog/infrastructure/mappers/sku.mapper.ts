/**
 * =====================================================================
 * SKU MAPPER - Infrastructure Layer
 * =====================================================================
 */

import {
  Sku as PrismaSku,
  SkuImage as PrismaSkuImage,
  SkuToOptionValue as PrismaSkuVariant,
  OptionValue as PrismaOptionValue,
  ProductOption as PrismaOption,
} from '@prisma/client';
import {
  Sku as SkuEntity,
  SkuProps,
  SkuStatus,
  SkuOptionValue,
  SkuImage,
} from '../../domain/entities/sku.entity';
import { Money } from '@core/domain/value-objects/money.vo';

type PrismaSkuWithRelations = PrismaSku & {
  images?: PrismaSkuImage[];
  optionValues?: (PrismaSkuVariant & {
    optionValue: PrismaOptionValue & {
      option: PrismaOption;
    };
  })[];
};

export class SkuMapper {
  static toDomain(prismaSku: PrismaSkuWithRelations): SkuEntity {
    const optionValues: SkuOptionValue[] = (prismaSku.optionValues ?? []).map(
      (ov) => ({
        optionId: ov.optionValue.optionId,
        optionName: ov.optionValue.option.name,
        valueId: ov.optionValue.id,
        value: ov.optionValue.value,
      }),
    );

    const images: SkuImage[] = (prismaSku.images ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? undefined,
      displayOrder: img.displayOrder,
    }));

    const props: SkuProps = {
      id: prismaSku.id,
      tenantId: prismaSku.tenantId,
      productId: prismaSku.productId,
      skuCode: prismaSku.skuCode,
      price: Money.create(Number(prismaSku.price ?? 0)),
      salePrice: prismaSku.salePrice
        ? Money.create(Number(prismaSku.salePrice))
        : undefined,
      stock: prismaSku.stock,
      reservedStock: prismaSku.reservedStock,
      status: prismaSku.status as SkuStatus,
      optionValues,
      imageUrl: prismaSku.imageUrl ?? undefined,
      images,
      metadata: prismaSku.metadata as Record<string, unknown> | undefined,
      createdAt: prismaSku.createdAt,
      updatedAt: prismaSku.updatedAt,
    };

    return SkuEntity.fromPersistence(props);
  }

  static toPersistence(sku: SkuEntity): Record<string, unknown> {
    return {
      id: sku.id,
      tenantId: sku.tenantId,
      productId: sku.productId,
      skuCode: sku.skuCode,
      price: sku.price.amount,
      salePrice: sku.salePrice?.amount,
      stock: sku.stock,
      reservedStock: sku.reservedStock,
      status: sku.status,
      imageUrl: sku.imageUrl,
      metadata: sku.metadata,
      updatedAt: sku.updatedAt,
    };
  }

  static toDomainList(prismaSkus: PrismaSkuWithRelations[]): SkuEntity[] {
    return prismaSkus.map((s) => this.toDomain(s));
  }
}
