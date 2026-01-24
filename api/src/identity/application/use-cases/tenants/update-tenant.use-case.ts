import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/repositories/tenant.repository.interface';
import { Tenant, TenantPlan } from '../../../domain/entities/tenant.entity';

export interface UpdateTenantInput {
  id: string;
  name?: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  plan?: TenantPlan;
  isActive?: boolean;
}

export type UpdateTenantOutput = { tenant: Tenant };

@Injectable()
export class UpdateTenantUseCase extends CommandUseCase<
  UpdateTenantInput,
  UpdateTenantOutput
> {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
  ) {
    super();
  }

  async execute(
    input: UpdateTenantInput,
  ): Promise<Result<UpdateTenantOutput>> {
    const tenant = await this.tenantRepository.findById(input.id);

    if (!tenant) {
      return Result.fail(new EntityNotFoundError('Tenant', input.id));
    }

    // Update Props partially
    const props = tenant.toPersistence() as any;
    const updatedTenant = Tenant.fromPersistence({
        ...props,
        ...input,
    });

    const saved = await this.tenantRepository.save(updatedTenant);

    return Result.ok({ tenant: saved });
  }
}
