import { Warehouse } from '../entities/warehouse.entity';

export const WAREHOUSE_REPOSITORY = 'WAREHOUSE_REPOSITORY';

export abstract class IWarehouseRepository {
  abstract findById(id: string): Promise<Warehouse | null>;
  abstract findByTenant(tenantId: string): Promise<Warehouse[]>;
  abstract findDefault(tenantId: string): Promise<Warehouse | null>;
  abstract save(warehouse: Warehouse): Promise<Warehouse>;
  abstract delete(id: string): Promise<void>;
  abstract clearDefault(tenantId: string): Promise<void>;
}
