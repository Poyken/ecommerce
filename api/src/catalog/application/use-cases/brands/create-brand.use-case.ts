import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { BusinessRuleViolationError } from '@/core/domain/errors/domain.error';
import { Brand } from '../../../domain/entities/brand.entity';
import {
  IBrandRepository,
  BRAND_REPOSITORY,
} from '../../../domain/repositories/brand.repository.interface';
import { v4 as uuidv4 } from 'uuid';

export interface CreateBrandInput {
  tenantId: string;
  name: string;
  slug?: string;
  imageUrl?: string;
}

export type CreateBrandOutput = { brand: Brand };
export type CreateBrandError = BusinessRuleViolationError;

@Injectable()
export class CreateBrandUseCase extends CommandUseCase<
  CreateBrandInput,
  CreateBrandOutput,
  CreateBrandError
> {
  constructor(
    @Inject(BRAND_REPOSITORY)
    private readonly brandRepository: IBrandRepository,
  ) {
    super();
  }

  async execute(
    input: CreateBrandInput,
  ): Promise<Result<CreateBrandOutput, CreateBrandError>> {
    const newBrand = Brand.create({
      id: uuidv4(),
      ...input,
    });

    const isUnique = await this.brandRepository.isSlugUnique(
      input.tenantId,
      newBrand.slug.value,
    );
    if (!isUnique) {
      return Result.fail(
        new BusinessRuleViolationError(
          `Brand slug '${newBrand.slug.value}' already exists`,
        ),
      );
    }

    const saved = await this.brandRepository.save(newBrand);

    return Result.ok({ brand: saved });
  }
}
