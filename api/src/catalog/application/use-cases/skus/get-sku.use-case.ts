import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import { Sku } from '../../../domain/entities/sku.entity';
import {
  ISkuRepository,
  SKU_REPOSITORY,
} from '../../../domain/repositories/sku.repository.interface';

export interface GetSkuInput {
  id: string;
  tenantId: string;
}

export type GetSkuOutput = { sku: Sku };
export type GetSkuError = EntityNotFoundError;

@Injectable()
export class GetSkuUseCase extends QueryUseCase<
  GetSkuInput,
  GetSkuOutput,
  GetSkuError
> {
  constructor(
    @Inject(SKU_REPOSITORY)
    private readonly skuRepository: ISkuRepository,
  ) {
    super();
  }

  async execute(
    input: GetSkuInput,
  ): Promise<Result<GetSkuOutput, GetSkuError>> {
    const sku = await this.skuRepository.findById(input.id);

    if (!sku || sku.tenantId !== input.tenantId) {
      return Result.fail(new EntityNotFoundError('Sku', input.id));
    }

    return Result.ok({ sku });
  }
}
