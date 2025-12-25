import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GHNService {
  private readonly logger = new Logger(GHNService.name);
  private readonly masterDataUrl: string;
  private readonly v2Url: string;
  private readonly token: string;
  private readonly shopId: string;

  constructor(private readonly configService: ConfigService) {
    const rawBaseUrl = this.configService.get('GHN_API_BASE_URL');

    // Nếu base URL chứa /v2/ hoặc kết thúc bằng /v2, ta cần bóc tách để lấy base thực sự
    // Standard: https://online-gateway.ghn.vn/shiip/public-api/
    let base = rawBaseUrl || 'https://online-gateway.ghn.vn/shiip/public-api/';
    if (base.includes('/v2')) {
      base = base.split('/v2')[0];
    }
    if (base.includes('/master-data')) {
      base = base.split('/master-data')[0];
    }

    // Đảm bảo kết thúc bằng /
    if (!base.endsWith('/')) base += '/';

    this.masterDataUrl = `${base}master-data/`;
    this.v2Url = `${base}v2/`;
    this.token = this.configService.get('GHN_TOKEN') || '';
    this.shopId = this.configService.get('GHN_SHOP_ID') || '';
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      Token: this.token,
      ShopId: this.shopId,
    };
  }

  async getProvinces() {
    try {
      const response = await axios.get(`${this.masterDataUrl}province`, {
        headers: this.headers,
      });
      return response.data.data;
    } catch (error) {
      this.logger.error(
        'Failed to fetch provinces from GHN',
        error.response?.data || error.message,
      );
      return [];
    }
  }

  async getDistricts(provinceId: number) {
    try {
      const response = await axios.get(`${this.masterDataUrl}district`, {
        params: { province_id: provinceId },
        headers: this.headers,
      });
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch districts for province ${provinceId} from GHN`,
        error.response?.data || error.message,
      );
      return [];
    }
  }

  async getWards(districtId: number) {
    try {
      const response = await axios.get(`${this.masterDataUrl}ward`, {
        params: { district_id: districtId },
        headers: this.headers,
      });
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to fetch wards for district ${districtId} from GHN`,
        error.response?.data || error.message,
      );
      return [];
    }
  }

  async calculateFee(data: {
    service_id?: number;
    service_type_id?: number;
    to_district_id: number;
    to_ward_code: string;
    height: number;
    length: number;
    weight: number;
    width: number;
    insurance_value?: number;
    coupon?: string;
  }) {
    const feeUrl =
      this.configService.get('GHN_FEE_URL') ||
      `${this.v2Url}shipping-order/fee`;
    try {
      const response = await axios.post(
        feeUrl,
        {
          ...data,
          from_district_id: parseInt(
            this.configService.get('GHN_FROM_DISTRICT_ID') || '1482',
          ), // Default to Hanoi Ba Dinh
          service_type_id: data.service_type_id || 2, // Default E-commerce service
        },
        { headers: this.headers },
      );
      return response.data.data.total;
    } catch (error) {
      this.logger.error(
        'Failed to calculate shipping fee from GHN',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async createShippingOrder(orderData: any) {
    const createUrl =
      this.configService.get('GHN_CREATE_ORDER_URL') ||
      `${this.v2Url}shipping-order/create`;
    try {
      const response = await axios.post(createUrl, orderData, {
        headers: this.headers,
      });
      return response.data.data;
    } catch (error) {
      this.logger.error(
        'Failed to create shipping order on GHN',
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
