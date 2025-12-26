import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    public readonly ghnService: GHNService,
    private readonly prisma: PrismaService,
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
   * Xử lý Webhook từ GHN để tự động cập nhật trạng thái đơn hàng
   * GHN Statuses: ready_to_pick, picking, picked, delivering, money_collect_delivering, delivered, cancel, return, returned...
   */
  async handleGHNWebhook(payload: any) {
    const { OrderCode, Status } = payload;

    if (!OrderCode || !Status) {
      this.logger.warn('Invalid GHN Webhook payload', payload);
      return { success: false, message: 'Invalid payload' };
    }

    this.logger.log(`Received GHN Webhook for order ${OrderCode}: ${Status}`);

    // Map GHN Status to our OrderStatus
    let newStatus: OrderStatus | null = null;

    const ghnStatus = Status.toLowerCase();

    if (
      ['picked', 'delivering', 'money_collect_delivering'].includes(ghnStatus)
    ) {
      newStatus = OrderStatus.SHIPPED;
    } else if (ghnStatus === 'delivered') {
      newStatus = OrderStatus.DELIVERED;
    } else if (ghnStatus === 'cancel') {
      newStatus = OrderStatus.CANCELLED;
    } else if (['return', 'returned'].includes(ghnStatus)) {
      newStatus = OrderStatus.RETURNED;
    }

    if (!newStatus) {
      return { success: true, message: 'Status ignored' };
    }

    try {
      const order = await this.prisma.order.findFirst({
        where: { shippingCode: OrderCode },
      });

      if (!order) {
        this.logger.warn(`Order with shipping code ${OrderCode} not found`);
        return { success: false, message: 'Order not found' };
      }

      // Chỉ cập nhật nếu trạng thái mới khác trạng thái hiện tại
      if (order.status !== newStatus) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: newStatus },
        });

        this.logger.log(
          `Updated order ${order.id} status to ${newStatus} via GHN Webhook`,
        );

        // [Mở rộng]: Có thể bắn Notification hoặc Email ở đây nếu cần
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error processing GHN Webhook', error);
      return { success: false, error: error.message };
    }
  }
}
