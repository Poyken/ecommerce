import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IWarehouseRepository,
  WAREHOUSE_REPOSITORY,
} from '../../domain/repositories/warehouse.repository.interface';
import { Warehouse } from '../../domain/entities/warehouse.entity';

export interface GetWarehousesInput {
  tenantId: string;
}

export type GetWarehousesOutput = { warehouses: Warehouse[] };

@Injectable()
export class GetWarehousesUseCase extends QueryUseCase<
  GetWarehousesInput,
  GetWarehousesOutput
> {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: IWarehouseRepository,
  ) {
    super();
  }

  async execute(
    input: GetWarehousesInput,
  ): Promise<Result<GetWarehousesOutput>> {
    const warehouses = await this.warehouseRepository.findByTenant(
      input.tenantId,
    );
    return Result.ok({ warehouses });
  }
}
