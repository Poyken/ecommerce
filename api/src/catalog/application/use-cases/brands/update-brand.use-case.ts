import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
} from '@/core/domain/errors/domain.error';
import { Brand } from '../../../domain/entities/brand.entity';
import {
  IBrandRepository,
  BRAND_REPOSITORY,
} from '../../../domain/repositories/brand.repository.interface';

export interface UpdateBrandInput {
  id: string;
  tenantId: string;
  name?: string;
  slug?: string;
  imageUrl?: string;
}

export type UpdateBrandOutput = { brand: Brand };
export type UpdateBrandError = BusinessRuleViolationError | EntityNotFoundError;

@Injectable()
export class UpdateBrandUseCase extends CommandUseCase<
  UpdateBrandInput,
  UpdateBrandOutput,
  UpdateBrandError
> {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) {
    super();
  }

  async execute(
    input: UpdateBrandInput,
  ): Promise<Result<UpdateBrandOutput, UpdateBrandError>> {
    const brand = await this.brandRepository.findById(input.id);
    if (!brand || brand.tenantId !== input.tenantId) {
      return Result.fail(new EntityNotFoundError('Brand', input.id));
    }

    brand.updateInfo({
      name: input.name,
      imageUrl: input.imageUrl,
    });

    const isUnique = await this.brandRepository.isSlugUnique(
      input.tenantId,
      brand.slug.value,
      brand.id,
    );
    if (!isUnique) {
      return Result.fail(
        new BusinessRuleViolationError(
          `Brand slug '${brand.slug.value}' already exists`,
        ),
      );
    }

    const saved = await this.brandRepository.save(brand);
    return Result.ok({ brand: saved });
  }
}
