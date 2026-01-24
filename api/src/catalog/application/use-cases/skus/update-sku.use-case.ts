import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
} from '@/core/domain/errors/domain.error';
import { Sku, SkuStatus } from '../../../domain/entities/sku.entity';
import { Money } from '@core/domain/value-objects/money.vo';
import {
  ISkuRepository,
  SKU_REPOSITORY,
} from '../../../domain/repositories/sku.repository.interface';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';
import { PrismaService } from '@core/prisma/prisma.service';
import { SkuOptionValue } from '../../../domain/entities/sku.entity';

export interface UpdateSkuInput {
  id: string;
  tenantId: string;
  skuCode?: string;
  price?: number;
  salePrice?: number;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  status?: SkuStatus;
  optionValueIds?: string[];
}

export type UpdateSkuOutput = { sku: Sku };
export type UpdateSkuError = BusinessRuleViolationError | EntityNotFoundError;

@Injectable()
export class UpdateSkuUseCase extends CommandUseCase<
  UpdateSkuInput,
  UpdateSkuOutput,
  UpdateSkuError
> {
  constructor(
    @Inject(SKU_REPOSITORY)
    private readonly skuRepository: ISkuRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async execute(
    input: UpdateSkuInput,
  ): Promise<Result<UpdateSkuOutput, UpdateSkuError>> {
    // 1. Find SKU
    const sku = await this.skuRepository.findById(input.id);
    if (!sku || sku.tenantId !== input.tenantId) {
      return Result.fail(new EntityNotFoundError('Sku', input.id));
    }

    // 2. Check SKU code uniqueness if changing
    if (input.skuCode && input.skuCode !== sku.skuCode) {
      const isUnique = await this.skuRepository.isCodeUnique(
        input.tenantId,
        input.skuCode,
        sku.id,
      );
      if (!isUnique) {
        return Result.fail(
          new BusinessRuleViolationError(
            `SKU code '${input.skuCode}' already exists`,
          ),
        );
      }
    }

    // 3. Resolve Option Values if provided
    let domainOptionValues: SkuOptionValue[] | undefined;
    let variantLabel: string | undefined;

    if (input.optionValueIds && input.optionValueIds.length > 0) {
      const optionValuesData = await (this.prisma.optionValue as any).findMany({
        where: { id: { in: input.optionValueIds } },
      });

      const mappedValues: SkuOptionValue[] = optionValuesData.map(
        (ov: any) => ({
          optionId: ov.optionId,
          valueId: ov.id,
          value: ov.value,
        }),
      );

      domainOptionValues = mappedValues;
      variantLabel = mappedValues.map((ov) => ov.value).join(' / ');
    }

    // 4. Fetch product name if not present on SKU
    let productName: string | undefined;
    if (!sku.productName) {
      const product = await this.productRepository.findById(sku.productId);
      if (product) {
        productName = (product as any).name;
      }
    }

    // 5. Update info
    sku.updateInfo({
      skuCode: input.skuCode,
      price: input.price ? Money.create(input.price) : undefined,
      salePrice:
        input.salePrice !== undefined
          ? input.salePrice
            ? Money.create(input.salePrice)
            : undefined
          : undefined,
      imageUrl: input.imageUrl,
      metadata: input.metadata,
      status: input.status,
      optionValues: domainOptionValues,
      productName,
      variantLabel,
    });

    // 4. Save
    const saved = await this.skuRepository.save(sku);

    return Result.ok({ sku: saved });
  }
}
