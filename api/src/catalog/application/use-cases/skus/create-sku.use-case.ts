import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
} from '@/core/domain/errors/domain.error';
import { Sku, SkuOptionValue } from '../../../domain/entities/sku.entity';
import { Money } from '@core/domain/value-objects/money.vo';
import {
  ISkuRepository,
  SKU_REPOSITORY,
} from '../../../domain/repositories/sku.repository.interface';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';
import { v4 as uuidv4 } from 'uuid';

export interface CreateSkuInput {
  tenantId: string;
  productId: string;
  skuCode: string;
  price: number;
  salePrice?: number;
  stock?: number;
  optionValueIds: string[];
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

export type CreateSkuOutput = { sku: Sku };
export type CreateSkuError = BusinessRuleViolationError | EntityNotFoundError;

@Injectable()
export class CreateSkuUseCase extends CommandUseCase<
  CreateSkuInput,
  CreateSkuOutput,
  CreateSkuError
> {
  constructor(
    @Inject(SKU_REPOSITORY)
    private readonly skuRepository: ISkuRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly prisma: PrismaService, // Inject Prisma for missing ports
  ) {
    super();
  }

  async execute(
    input: CreateSkuInput,
  ): Promise<Result<CreateSkuOutput, CreateSkuError>> {
    // 1. Check product existence
    const product = await this.productRepository.findById(input.productId);
    if (!product || product.tenantId !== input.tenantId) {
      return Result.fail(new EntityNotFoundError('Product', input.productId));
    }

    // 2. Check SKU code uniqueness
    const isUnique = await this.skuRepository.isCodeUnique(
      input.tenantId,
      input.skuCode,
    );
    if (!isUnique) {
      return Result.fail(
        new BusinessRuleViolationError(
          `SKU code '${input.skuCode}' already exists`,
        ),
      );
    }

    // 3. Resolve Option Values
    const optionValuesData = await (this.prisma.optionValue as any).findMany({
      where: { id: { in: input.optionValueIds } },
    });

    const domainOptionValues: SkuOptionValue[] = optionValuesData.map(
      (ov: any) => ({
        optionId: ov.optionId,
        valueId: ov.id,
        value: ov.value,
      }),
    );

    // Generate variant label (e.g., "Red / XL")
    const variantLabel = domainOptionValues.map((ov) => ov.value).join(' / ');

    // 4. Create SKU
    const sku = Sku.create({
      id: uuidv4(),
      tenantId: input.tenantId,
      productId: input.productId,
      skuCode: input.skuCode,
      price: Money.create(input.price),
      salePrice: input.salePrice ? Money.create(input.salePrice) : undefined,
      stock: input.stock,
      optionValues: domainOptionValues,
      imageUrl: input.imageUrl,
      productName: (product as any).name, // product is from IProductRepository
      variantLabel,
      metadata: input.metadata,
    });

    // 4. Save
    const saved = await this.skuRepository.save(sku);

    return Result.ok({ sku: saved });
  }
}
