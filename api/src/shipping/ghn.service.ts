import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * =====================================================================
 * GHN SERVICE - TÍCH HỢP ĐỐI TÁC GIAO HÀNG NHANH
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GHN API CORE:
 * - Đây là service chịu trách nhiệm giao tiếp với hệ thống Giao Hàng Nhanh (GHN).
 * - Nó xử lý việc lấy danh sách Tỉnh/Huyện/Xã, tính phí ship, tạo đơn và hủy đơn trên hệ thống GHN.
 *
 * 2. TIMEOUT & FALLBACK (CỰC KỲ QUAN TRỌNG):
 * - Khi gọi API bên thứ 3 (GHN), có thể xảy ra trường hợp mạng chậm hoặc server GHN bảo trì.
 * - Ta dùng `Promise.race` để set timeout 5 giây. Nếu GHN không phản hồi kịp -> Hệ thống tự động dùng mức phí ship mặc định (30,000đ) để không làm gián đoạn việc đặt hàng của khách.
 *
 * 3. TOKEN & SHOP ID:
 * - Mọi request gửi lên GHN đều phải kèm `Token` định danh và `ShopId` để GHN biết đơn hàng thuộc về shop nào.
 * =====================================================================
 */
@Injectable()
export class GHNService {
  private readonly logger = new Logger(GHNService.name);
  private readonly masterDataUrl: string;
  private readonly v2Url: string;
  private readonly token: string;
  private readonly shopId: string;

  // In-memory cache for provinces (rarely changes)
  private provincesCache: any[] | null = null;
  private provincesCacheTime: number = 0;
  private readonly PROVINCES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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

  private get baseHeaders() {
    return {
      'Content-Type': 'application/json',
      Token: this.token,
    };
  }

  private get shopHeaders() {
    return {
      ...this.baseHeaders,
      ShopId: this.shopId,
    };
  }

  async getProvinces() {
    // Check cache first
    const now = Date.now();
    if (
      this.provincesCache &&
      now - this.provincesCacheTime < this.PROVINCES_CACHE_TTL
    ) {
      return this.provincesCache;
    }

    try {
      const response = await axios.get(`${this.masterDataUrl}province`, {
        headers: this.baseHeaders,
        timeout: 5000,
      });
      this.provincesCache = response.data.data;
      this.provincesCacheTime = now;
      return response.data.data;
    } catch (error) {
      this.logger.error(
        'Failed to fetch provinces from GHN',
        error.response?.data || error.message,
      );
      // Return cached data if available, even if stale
      if (this.provincesCache) {
        this.logger.warn('Returning stale provinces cache');
        return this.provincesCache;
      }
      return [];
    }
  }

  async getDistricts(provinceId: number) {
    try {
      const response = await axios.get(`${this.masterDataUrl}district`, {
        params: { province_id: provinceId },
        headers: this.baseHeaders,
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
        headers: this.baseHeaders,
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

  /**
   * Calculate shipping fee from GHN
   * ✅ Production-safe: Has timeout + fallback
   */
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
      // ✅ Add timeout wrapper to prevent hanging
      const response = await Promise.race([
        axios.post(
          feeUrl,
          {
            ...data,
            from_district_id: parseInt(
              this.configService.get('GHN_FROM_DISTRICT_ID') || '1482',
            ), // Default to Hanoi Ba Dinh
            service_type_id: data.service_type_id || 2, // Default E-commerce service
          },
          {
            headers: this.shopHeaders,
            timeout: 5000, // 5 second axios timeout
          },
        ),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('GHN API timeout after 5s')), 5000),
        ),
      ]);

      return response.data.data.total;
    } catch (error) {
      this.logger.error(
        'Failed to calculate shipping fee from GHN, using default',
        error.response?.data || error.message,
      );

      // ✅ Graceful fallback - return default shipping fee
      return 30000; // Default 30,000 VND
    }
  }

  async createShippingOrder(orderData: any) {
    const createUrl =
      this.configService.get('GHN_CREATE_ORDER_URL') ||
      `${this.v2Url}shipping-order/create`;
    try {
      const payload = {
        ...orderData,
        from_district_id: parseInt(
          this.configService.get('GHN_FROM_DISTRICT_ID') || '1442',
        ),
        from_ward_code: this.configService.get('GHN_FROM_WARD_CODE') || '20308',
      };
      const response = await axios.post(createUrl, payload, {
        headers: this.shopHeaders,
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

  /**
   * Cancel order on GHN system
   */
  async cancelOrder(orderCode: string): Promise<boolean> {
    const cancelUrl =
      this.configService.get('GHN_CANCEL_ORDER_URL') ||
      `${this.v2Url}switch-status/cancel`;

    try {
      const response = await axios.post(
        cancelUrl,
        {
          order_codes: [orderCode],
        },
        {
          headers: this.shopHeaders,
        },
      );

      // GHN response format: { code: 200, data: [{ order_code: '...', result: true, message: '...' }] }
      const result = response.data.data;
      if (Array.isArray(result) && result.length > 0) {
        if (result[0].result) {
          this.logger.log(`Successfully cancelled order ${orderCode} on GHN`);
          return true;
        } else {
          this.logger.warn(
            `Failed to cancel order ${orderCode} on GHN: ${result[0].message}`,
          );
          return false;
        }
      }
      return false;
    } catch (error) {
      this.logger.error(
        `Failed to cancel order ${orderCode} on GHN`,
        error.response?.data || error.message,
      );
      // Don't throw, just return false so main flow can decide
      return false;
    }
  }

  async getOrderDetail(orderCode: string): Promise<any> {
    const detailUrl =
      this.configService.get('GHN_DETAIL_ORDER_URL') ||
      `${this.v2Url}shipping-order/detail`;

    try {
      const response = await axios.post(
        detailUrl,
        {
          order_code: orderCode,
        },
        {
          headers: this.shopHeaders,
        },
      );
      return response.data.data;
    } catch (error) {
      this.logger.error(
        `Failed to get order detail for ${orderCode} from GHN`,
        error.response?.data || error.message,
      );
      return null;
    }
  }
}
