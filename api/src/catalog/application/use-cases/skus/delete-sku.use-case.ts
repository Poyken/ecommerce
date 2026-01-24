import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
} from '@/core/domain/errors/domain.error';
import {
  ISkuRepository,
  SKU_REPOSITORY,
} from '../../../domain/repositories/sku.repository.interface';

export interface DeleteSkuInput {
  id: string;
  tenantId: string;
}

export type DeleteSkuOutput = void;
export type DeleteSkuError = EntityNotFoundError | BusinessRuleViolationError;

@Injectable()
export class DeleteSkuUseCase extends CommandUseCase<
  DeleteSkuInput,
  DeleteSkuOutput,
  DeleteSkuError
> {
  constructor(
    @Inject(SKU_REPOSITORY)
    private readonly skuRepository: ISkuRepository,
  ) {
    super();
  }

  async execute(
    input: DeleteSkuInput,
  ): Promise<Result<DeleteSkuOutput, DeleteSkuError>> {
    const sku = await this.skuRepository.findById(input.id);

    if (!sku || sku.tenantId !== input.tenantId) {
      return Result.fail(new EntityNotFoundError('Sku', input.id));
    }

    // Additional rules: prevent deletion if stock > 0?
    // Usually we allow but with warning. Here stay simple.

    await this.skuRepository.delete(input.id);

    return Result.ok(undefined);
  }
}
