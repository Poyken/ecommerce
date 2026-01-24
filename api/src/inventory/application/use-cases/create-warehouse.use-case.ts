import { Injectable, Inject } from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IWarehouseRepository,
  WAREHOUSE_REPOSITORY,
} from '../../domain/repositories/warehouse.repository.interface';
import { Warehouse } from '../../domain/entities/warehouse.entity';
import { v4 as uuidv4 } from 'uuid';

export interface CreateWarehouseInput {
  tenantId: string;
  name: string;
  address?: string;
  isDefault?: boolean;
}

export type CreateWarehouseOutput = { warehouse: Warehouse };

@Injectable()
export class CreateWarehouseUseCase extends CommandUseCase<
  CreateWarehouseInput,
  CreateWarehouseOutput
> {
  constructor(
    @Inject(WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: IWarehouseRepository,
  ) {
    super();
  }

  async execute(
    input: CreateWarehouseInput,
  ): Promise<Result<CreateWarehouseOutput>> {
    // If setting as default, clear existing default
    if (input.isDefault) {
      await this.warehouseRepository.clearDefault(input.tenantId);
    }

    const warehouse = Warehouse.create({
      id: uuidv4(),
      tenantId: input.tenantId,
      name: input.name,
      address: input.address,
      isDefault: input.isDefault,
    });

    const saved = await this.warehouseRepository.save(warehouse);

    return Result.ok({ warehouse: saved });
  }
}
