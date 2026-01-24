import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import { Brand } from '../../../domain/entities/brand.entity';
import {
  IBrandRepository,
  BRAND_REPOSITORY,
} from '../../../domain/repositories/brand.repository.interface';

export interface GetBrandInput {
  id: string;
  tenantId: string;
}

export type GetBrandOutput = { brand: Brand };
export type GetBrandError = EntityNotFoundError;

@Injectable()
export class GetBrandUseCase extends QueryUseCase<
  GetBrandInput,
  GetBrandOutput,
  GetBrandError
> {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) {
    super();
  }

  async execute(
    input: GetBrandInput,
  ): Promise<Result<GetBrandOutput, GetBrandError>> {
    const brand = await this.brandRepository.findById(input.id);

    if (!brand || brand.tenantId !== input.tenantId) {
      return Result.fail(new EntityNotFoundError('Brand', input.id));
    }

    return Result.ok({ brand });
  }
}
