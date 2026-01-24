import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import { Product } from '../../../domain/entities/product.entity';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';

export interface GetRelatedProductsInput {
  productId: string;
  limit?: number;
}

export type GetRelatedProductsOutput = { products: Product[] };
export type GetRelatedProductsError = EntityNotFoundError;

@Injectable()
export class GetRelatedProductsUseCase extends QueryUseCase<
  GetRelatedProductsInput,
  GetRelatedProductsOutput,
  GetRelatedProductsError
> {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {
    super();
  }

  async execute(
    input: GetRelatedProductsInput,
  ): Promise<Result<GetRelatedProductsOutput, GetRelatedProductsError>> {
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      return Result.fail(new EntityNotFoundError('Product', input.productId));
    }

    const related = await this.productRepository.findRelated(
      input.productId,
      [...product.categoryIds],
      input.limit || 5,
    );

    return Result.ok({ products: related });
  }
}
