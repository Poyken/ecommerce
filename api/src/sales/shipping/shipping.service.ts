import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

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

import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { NotificationsService } from '@/notifications/notifications.service';
import { EmailService } from '@integrations/email/email.service';
import { GHNService } from './ghn.service';
import { UpdateShipmentStatusUseCase } from '../application/use-cases/shipments/update-shipment-status.use-case';
import { ShipmentStatus } from '../domain/entities/shipment.entity';

/**
 * =====================================================================
 * SHIPPING SERVICE - QUẢN LÝ VẬN CHUYỂN & GIAO VẬN
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ĐƠN VỊ VẬN CHUYỂN (GHN):
 * - Hệ thống sử dụng Giao Hàng Nhanh (GHN) làm đối tác vận chuyển chính.
 * - Mọi thao tác lấy Tỉnh/Thành, tính phí ship đều được ủy quyền cho `ghnService`.
 *
 * 2. WEBHOOK & AUTO-UPDATE:
 * - `handleGHNWebhook`: Đây là endpoint "hứng" thông tin từ phía GHN bắn về.
 * - Khi shipper cập nhật trạng thái (Đã lấy hàng, Đang giao, Đã giao), GHN sẽ gọi vào đây.
 * - Hệ thống tự động map trạng thái của GHN sang `OrderStatus` của mình và cập nhật DB -> Gửi Email/Noti cho khách ngay lập tức mà không cần Admin can thiệp.
 *
 * 3. FEE CALCULATION:
 * - Phí vận chuyển được tính dựa trên DistrictID và WardCode.
 * - Mặc định tính theo gói 1kg để có giá dự kiến nhanh nhất cho khách. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tích hợp với GHN/GHTK để lấy mã vận đơn, tính phí ship thời gian thực và tự động cập nhật trạng thái đơn hàng qua Webhook.

 * =====================================================================
 */
@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    public readonly ghnService: GHNService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly emailService: EmailService,
    private readonly updateShipmentStatusUseCase: UpdateShipmentStatusUseCase,
  ) {}

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

  /**
   * Xử lý Webhook từ GHN để tự động cập nhật trạng thái đơn hàng.
   * GHN Statuses: ready_to_pick, picking, picked, delivering, delivered, cancel, return, returned...
   *
   * Logic: Map trạng thái GHN sang trạng thái nội bộ -> Update DB (qua Shipment UseCase) -> Gửi Noti/Email.
   */
  async handleGHNWebhook(payload: any) {
    const { OrderCode, Status } = payload;

    if (!OrderCode || !Status) {
      this.logger.warn('Invalid GHN Webhook payload', payload);
      return { success: false, message: 'Invalid payload' };
    }

    this.logger.log(`Received GHN Webhook for order ${OrderCode}: ${Status}`);

    // Map GHN Status to our ShipmentStatus
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

    if (!newStatus) {
      return { success: true, message: 'Status ignored' };
    }

    const result = await this.updateShipmentStatusUseCase.execute({
      trackingCode: OrderCode,
      status: newStatus,
      expectedDeliveryTime: payload.ExpectedDeliveryTime
        ? new Date(payload.ExpectedDeliveryTime)
        : undefined,
      reason: payload.Reason,
    });

    if (result.isFailure) {
      return { success: false, message: result.error.message };
    }

    return { success: true };
  }
}
