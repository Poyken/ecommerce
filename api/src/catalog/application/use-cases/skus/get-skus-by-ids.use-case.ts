import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { Sku } from '../../../domain/entities/sku.entity';
import {
  ISkuRepository,
  SKU_REPOSITORY,
} from '../../../domain/repositories/sku.repository.interface';

export interface GetSkusByIdsInput {
  skuIds: string[];
}

export type GetSkusByIdsOutput = { skus: Sku[] };
export type GetSkusByIdsError = any;

@Injectable()
export class GetSkusByIdsUseCase extends QueryUseCase<
  GetSkusByIdsInput,
  GetSkusByIdsOutput,
  GetSkusByIdsError
> {
  constructor(
    @Inject(SKU_REPOSITORY)
    private readonly skuRepository: ISkuRepository,
  ) {
    super();
  }

  async execute(
    input: GetSkusByIdsInput,
  ): Promise<Result<GetSkusByIdsOutput, GetSkusByIdsError>> {
    const skus = await this.skuRepository.findByIds(input.skuIds);
    return Result.ok({ skus });
  }
}
