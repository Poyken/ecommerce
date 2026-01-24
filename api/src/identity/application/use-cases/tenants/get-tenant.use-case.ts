import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { EntityNotFoundError } from '@/core/domain/errors/domain.error';
import { ITenantRepository, TENANT_REPOSITORY } from '../../../domain/repositories/tenant.repository.interface';
import { Tenant } from '../../../domain/entities/tenant.entity';

export interface GetTenantInput {
  id?: string;
  subdomain?: string;
  domain?: string;
}

export type GetTenantOutput = { tenant: Tenant };

@Injectable()
export class GetTenantUseCase extends QueryUseCase<
  GetTenantInput,
  GetTenantOutput
> {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: ITenantRepository,
  ) {
    super();
  }

  async execute(
    input: GetTenantInput,
  ): Promise<Result<GetTenantOutput>> {
    let tenant: Tenant | null = null;

    if (input.id) {
      tenant = await this.tenantRepository.findById(input.id);
    } else if (input.subdomain) {
      tenant = await this.tenantRepository.findBySubdomain(input.subdomain);
    } else if (input.domain) {
      tenant = await this.tenantRepository.findByDomain(input.domain);
    }

    if (!tenant) {
      return Result.fail(new EntityNotFoundError('Tenant', input.id || input.subdomain || input.domain || 'unknown'));
    }

    return Result.ok({ tenant });
  }
}
