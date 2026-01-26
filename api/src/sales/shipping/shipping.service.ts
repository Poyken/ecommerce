import { Injectable, Logger } from '@nestjs/common';
import { GHNService } from './ghn.service';
import { UpdateShipmentStatusUseCase } from './application/use-cases/update-shipment-status.use-case';
import { GetShippingLocationUseCase } from './application/use-cases/get-shipping-location.use-case';
import { CalculateShippingFeeUseCase } from './application/use-cases/calculate-shipping-fee.use-case';
import { ShipmentStatus } from '../domain/entities/shipment.entity';
import { LocationType } from './application/use-cases/types';

/**
 * =====================================================================
 * SHIPPING SERVICE - QUẢN LÝ VẬN CHUYỂN & GIAO VẬN
 * =====================================================================
 */
@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    public readonly ghnService: GHNService,
    private readonly updateShipmentStatusUseCase: UpdateShipmentStatusUseCase,
    private readonly getShippingLocationUseCase: GetShippingLocationUseCase,
    private readonly calculateShippingFeeUseCase: CalculateShippingFeeUseCase,
  ) {}

  async getProvinces() {
    const result = await this.getShippingLocationUseCase.execute({
      type: LocationType.PROVINCE,
    });
    return result.isSuccess ? result.value : [];
  }

  async getDistricts(provinceId: number) {
    const result = await this.getShippingLocationUseCase.execute({
      type: LocationType.DISTRICT,
      parentId: provinceId,
    });
    return result.isSuccess ? result.value : [];
  }

  async getWards(districtId: number) {
    const result = await this.getShippingLocationUseCase.execute({
      type: LocationType.WARD,
      parentId: districtId,
    });
    return result.isSuccess ? result.value : [];
  }

  async calculateFee(
    toDistrictId: number,
    toWardCode: string,
  ): Promise<number> {
    const result = await this.calculateShippingFeeUseCase.execute({
      toDistrictId,
      toWardCode,
    });
    return result.isSuccess ? result.value : 30000;
  }

  /**
   * Xử lý Webhook từ GHN để tự động cập nhật trạng thái đơn hàng.
   */
  async handleGHNWebhook(payload: any) {
    const { OrderCode, Status } = payload;

    if (!OrderCode || !Status) {
      this.logger.warn('Invalid GHN Webhook payload', payload);
      return { success: false, message: 'Invalid payload' };
    }

    this.logger.log(
      `Received GHN Webhook for shipment ${OrderCode}: ${Status}`,
    );

    const statusMapping: Record<string, ShipmentStatus> = {
      ready_to_pick: ShipmentStatus.READY_TO_SHIP,
      picking: ShipmentStatus.READY_TO_SHIP,
      picked: ShipmentStatus.SHIPPED,
      delivering: ShipmentStatus.SHIPPED,
      money_collect_delivering: ShipmentStatus.SHIPPED,
      delivered: ShipmentStatus.DELIVERED,
      cancel: ShipmentStatus.FAILED,
      return: ShipmentStatus.RETURNED,
      returned: ShipmentStatus.RETURNED,
    };

    const newStatus = statusMapping[Status.toLowerCase()];
    if (!newStatus) return { success: true, message: 'Status ignored' };

    const result = await this.updateShipmentStatusUseCase.execute({
      trackingCode: OrderCode,
      status: newStatus,
      expectedDeliveryTime: payload.ExpectedDeliveryTime
        ? new Date(payload.ExpectedDeliveryTime)
        : undefined,
      reason: payload.Reason,
    });

    return {
      success: result.isSuccess,
      message: result.isFailure ? result.error.message : undefined,
    };
  }
}
