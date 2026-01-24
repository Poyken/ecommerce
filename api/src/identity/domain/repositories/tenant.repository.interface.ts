import { Tenant } from '../entities/tenant.entity';

export const TENANT_REPOSITORY = 'TENANT_REPOSITORY';

export abstract class ITenantRepository {
  abstract findById(id: string): Promise<Tenant | null>;
  abstract findByDomain(domain: string): Promise<Tenant | null>;
  abstract findBySubdomain(subdomain: string): Promise<Tenant | null>;
  abstract findByOwner(ownerId: string): Promise<Tenant[]>;
  abstract save(tenant: Tenant): Promise<Tenant>;
  abstract delete(id: string): Promise<void>;
  abstract exists(id: string): Promise<boolean>;
}
