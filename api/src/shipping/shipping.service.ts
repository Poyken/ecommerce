import { Injectable } from '@nestjs/common';

export interface Province {
  ProvinceID: number;
  ProvinceName: string;
}

export interface District {
  DistrictID: number;
  DistrictName: string;
}

export interface Ward {
  WardCode: string;
  WardName: string;
}

import { GHNService } from './ghn.service';

@Injectable()
export class ShippingService {
  constructor(public readonly ghnService: GHNService) {}

  getProvinces(): Promise<Province[]> {
    return this.ghnService.getProvinces();
  }

  getDistricts(provinceId: number): Promise<District[]> {
    return this.ghnService.getDistricts(provinceId);
  }

  getWards(districtId: number): Promise<Ward[]> {
    return this.ghnService.getWards(districtId);
  }

  async calculateFee(
    toDistrictId: number,
    toWardCode: string,
  ): Promise<number> {
    return this.ghnService.calculateFee({
      to_district_id: toDistrictId,
      to_ward_code: toWardCode,
      weight: 1000, // Default weight 1kg
      length: 10,
      width: 10,
      height: 10,
    });
  }
}
