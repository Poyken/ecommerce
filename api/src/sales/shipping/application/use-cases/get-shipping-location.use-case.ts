import { Injectable, Logger } from '@nestjs/common';
import { QueryUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { GHNService } from '../../ghn.service';
import { LocationType } from './types';

export interface GetShippingLocationInput {
  type: LocationType;
  parentId?: number; // provinceId for districts, districtId for wards
}

@Injectable()
export class GetShippingLocationUseCase extends QueryUseCase<
  GetShippingLocationInput,
  any[]
> {
  private readonly logger = new Logger(GetShippingLocationUseCase.name);

  constructor(private readonly ghnService: GHNService) {
    super();
  }

  async execute(input: GetShippingLocationInput): Promise<Result<any[]>> {
    try {
      let data: any[] = [];
      switch (input.type) {
        case LocationType.PROVINCE:
          data = await this.ghnService.getProvinces();
          break;
        case LocationType.DISTRICT:
          if (!input.parentId)
            return Result.fail(
              new Error('Province ID is required for districts'),
            );
          data = await this.ghnService.getDistricts(input.parentId);
          break;
        case LocationType.WARD:
          if (!input.parentId)
            return Result.fail(new Error('District ID is required for wards'));
          data = await this.ghnService.getWards(input.parentId);
          break;
      }
      return Result.ok(data);
    } catch (error) {
      this.logger.error(`Failed to fetch shipping locations: ${error.message}`);
      return Result.fail(error);
    }
  }
}
