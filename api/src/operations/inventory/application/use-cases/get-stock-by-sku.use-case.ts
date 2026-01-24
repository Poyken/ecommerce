import { Injectable, Inject } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  IInventoryRepository,
  INVENTORY_REPOSITORY,
} from '../../domain/repositories/inventory.repository.interface';
import { InventoryItem } from '../../domain/entities/inventory-item.entity';

export interface GetStockBySkuInput {
  skuId: string;
  tenantId: string;
}

export type GetStockBySkuOutput = { stock: InventoryItem[] };

@Injectable()
export class GetStockBySkuUseCase extends QueryUseCase<
  GetStockBySkuInput,
  GetStockBySkuOutput
> {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: IInventoryRepository,
  ) {
    super();
  }

  async execute(
    input: GetStockBySkuInput,
  ): Promise<Result<GetStockBySkuOutput>> {
    const stock = await this.inventoryRepository.findBySku(
      input.skuId,
      input.tenantId,
    );
    return Result.ok({ stock });
  }
}
