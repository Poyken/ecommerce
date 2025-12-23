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

@Injectable()
export class ShippingService {
  // MOCK DATA for "Tuorial/MVP" phase
  // In real life, fetch from https://online-gateway.ghn.vn/shiip/public-api/master-data/...

  async getProvinces(): Promise<Province[]> {
    return [
      { ProvinceID: 201, ProvinceName: 'Hà Nội' },
      { ProvinceID: 202, ProvinceName: 'Hồ Chí Minh' },
      { ProvinceID: 203, ProvinceName: 'Đà Nẵng' },
    ];
  }

  async getDistricts(provinceId: number): Promise<District[]> {
    if (provinceId == 201) {
      return [
        { DistrictID: 1482, DistrictName: 'Quận Ba Đình' },
        { DistrictID: 1484, DistrictName: 'Quận Đống Đa' },
        { DistrictID: 1485, DistrictName: 'Quận Hai Bà Trưng' },
      ]; // Hanoi Districts
    }
    if (provinceId == 202) {
      return [
        { DistrictID: 1442, DistrictName: 'Quận 1' },
        { DistrictID: 1443, DistrictName: 'Quận 3' },
        { DistrictID: 1444, DistrictName: 'Thành phố Thủ Đức' },
      ]; // HCM Districts
    }
    return [{ DistrictID: 9999, DistrictName: 'Quận Trung Tâm' }];
  }

  async getWards(districtId: number): Promise<Ward[]> {
    // Mock Wards
    return [
      { WardCode: '1A0101', WardName: 'Phường 1' },
      { WardCode: '1A0102', WardName: 'Phường 2' },
      { WardCode: '1A0103', WardName: 'Phường 3' },
      { WardCode: '1A0104', WardName: 'Xã Phú Minh' },
    ];
  }

  async calculateFee(
    toDistrictId: number,
    toWardCode: string,
  ): Promise<number> {
    // Mock Fee Logic
    // If District > 1480 (Hanoi) and we are in Hanoi, cheap.
    // If District < 1450 (HCM), expensive.

    // In real app, you need 'fromDistrictId' (Store config).

    if (toDistrictId > 1480 && toDistrictId < 1500) {
      return 15000; // Local
    }
    if (toDistrictId > 1440 && toDistrictId < 1450) {
      return 30000; // HCM - Long distance
    }
    return 25000; // Standard
  }
}
