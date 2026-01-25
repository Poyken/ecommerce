import { CommandUseCase } from '@core/application/use-case.interface';
import { Result } from '@core/application/result';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { SkuManagerService } from '@/catalog/products/sku-manager.service';

export interface BulkUpdateSkusInput {
  productId: string;
  skus: Array<{
    id: string;
    price?: number;
    salePrice?: number;
    stock?: number;
  }>;
}

export type BulkUpdateSkusOutput = {
  success: boolean;
  count: number;
};

@Injectable()
export class BulkUpdateSkusUseCase extends CommandUseCase<
  BulkUpdateSkusInput,
  BulkUpdateSkusOutput
> {
  private readonly logger = new Logger(BulkUpdateSkusUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly skuManager: SkuManagerService,
  ) {
    super();
  }

  async execute(
    input: BulkUpdateSkusInput,
  ): Promise<Result<BulkUpdateSkusOutput, Error>> {
    const { productId, skus } = input;

    try {
      // 1. Validate: Ensure all SKUs belong to this product
      const skuIds = skus.map((s) => s.id);
      const existingSkus = await this.prisma.sku.findMany({
        where: {
          id: { in: skuIds },
          productId: productId,
        },
        select: { id: true },
      });

      if (existingSkus.length !== skus.length) {
        return Result.fail(
          new NotFoundException(
            'Một hoặc nhiều SKU không thuộc về sản phẩm này',
          ),
        );
      }

      // 2. Perform updates in a transaction
      await this.prisma.$transaction(
        skus.map((sku) =>
          this.prisma.sku.update({
            where: { id: sku.id },
            data: {
              ...(sku.price !== undefined && { price: sku.price }),
              ...(sku.salePrice !== undefined && { salePrice: sku.salePrice }),
              ...(sku.stock !== undefined && { stock: sku.stock }),
            },
          }),
        ),
      );

      // 3. Re-calculate min/max price for parent product
      // This ensures PLP (Product Listing Page) shows correct prices
      await this.skuManager.updateProductPriceRange(productId);

      this.logger.log(
        `Bulk updated ${skus.length} SKUs for product ${productId}`,
      );

      return Result.ok({ success: true, count: skus.length });
    } catch (error) {
      this.logger.error(
        `Failed to bulk update SKUs for product ${productId}`,
        error,
      );
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
