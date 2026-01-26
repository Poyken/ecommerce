import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  RawBodyRequest,
  Req,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeController } from '@nestjs/swagger';
import { PrismaService } from '@/core/prisma/prisma.service';
import { Request } from 'express';

// Interface cho GHN Webhook Payload
interface GHNWebhookPayload {
  CODAmount?: number;
  CODTransferDate?: string;
  ClientOrderCode?: string;
  ConvertedWeight?: number;
  Description?: string;
  Fee?: {
    CODFailedFee: number;
    CODFee: number;
    Coupon: number;
    DeliverRemoteAreasFee: number;
    DocumentReturn: number;
    DoubleCheck: number;
    Insurance: number;
    MainService: number;
    PickRemoteAreasFee: number;
    R2S: number;
    Return: number;
    StationDO: number;
    StationPU: number;
    Total: number;
  };
  Height?: number;
  IsPartialReturn?: boolean;
  Length?: number;
  OrderCode?: string; // Mã vận đơn GHN
  PartialReturnCode?: string;
  PaymentType?: number;
  Reason?: string;
  ReasonCode?: string;
  ShopID?: number;
  Status?: string; // Trạng thái GHN
  Time?: string;
  Type?: string;
  Warehouse?: string;
  Weight?: number;
  Width?: number;
}

// Interface cho GHTK Webhook Payload (placeholder)
interface GHTKWebhookPayload {
  label_id?: string;
  partner_id?: string;
  order_id?: string;
  status_id?: number;
  action_time?: string;
  reason_code?: string;
  reason?: string;
  weight?: number;
  fee?: number;
  return_part_package?: boolean;
}

// Type cho Shipment update data
interface ShipmentUpdateData {
  status: ShipmentStatus;
  shippedAt?: Date;
  deliveredAt?: Date;
}

import { ShipmentStatus } from '@/sales/domain/entities/shipment.entity';
import { UpdateShipmentStatusUseCase } from '@/sales/shipping/application/use-cases/update-shipment-status.use-case';

@ApiTags('Webhooks')
@ApiExcludeController()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly updateShipmentStatusUseCase: UpdateShipmentStatusUseCase,
  ) {}

  /**
   * Webhook endpoint cho Giao Hàng Nhanh (GHN)
   */
  @Post('ghn')
  @ApiOperation({ summary: 'GHN Webhook callback' })
  async handleGHNWebhook(
    @Body() payload: GHNWebhookPayload,
    @Headers('x-ghn-signature') signature: string,
  ) {
    this.logger.log(`[GHN Webhook] Nhận payload: ${JSON.stringify(payload)}`);

    try {
      const { OrderCode, Status } = payload;

      if (!OrderCode || !Status) {
        this.logger.warn('[GHN Webhook] Thiếu OrderCode hoặc Status');
        return { success: true, message: 'Missing required fields' };
      }

      // Map GHN status to ShipmentStatus
      const statusMapping: Record<string, ShipmentStatus> = {
        ready_to_pick: ShipmentStatus.READY_TO_SHIP,
        picking: ShipmentStatus.READY_TO_SHIP,
        picked: ShipmentStatus.SHIPPED,
        storing: ShipmentStatus.SHIPPED,
        transporting: ShipmentStatus.SHIPPED,
        sorting: ShipmentStatus.SHIPPED,
        delivering: ShipmentStatus.SHIPPED,
        delivered: ShipmentStatus.DELIVERED,
        delivery_fail: ShipmentStatus.FAILED,
        waiting_to_return: ShipmentStatus.RETURNED,
        return: ShipmentStatus.RETURNED,
        return_transporting: ShipmentStatus.RETURNED,
        return_sorting: ShipmentStatus.RETURNED,
        returning: ShipmentStatus.RETURNED,
        returned: ShipmentStatus.RETURNED,
        cancel: ShipmentStatus.FAILED,
        exception: ShipmentStatus.FAILED,
        lost: ShipmentStatus.FAILED,
        damage: ShipmentStatus.FAILED,
      };

      const newStatus = statusMapping[Status.toLowerCase()];

      if (!newStatus) {
        this.logger.warn(`[GHN Webhook] Trạng thái không được map: ${Status}`);
        return { success: true, message: 'Status not mapped' };
      }

      const result = await this.updateShipmentStatusUseCase.execute({
        trackingCode: OrderCode,
        status: newStatus,
        reason: payload.Reason,
        expectedDeliveryTime: payload.Time ? new Date(payload.Time) : undefined,
      });

      if (result.isFailure) {
        this.logger.error(
          `[GHN Webhook] Lỗi xử lý UseCase: ${result.error.message}`,
        );
        return { success: false, message: result.error.message };
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error(`[GHN Webhook] Lỗi hệ thống: ${error.message}`, error);
      return { success: false, message: 'Internal server error' };
    }
  }

  /**
   * Webhook endpoint cho Giao Hàng Tiết Kiệm (GHTK)
   */
  @Post('ghtk')
  @ApiOperation({ summary: 'GHTK Webhook callback' })
  async handleGHTKWebhook(@Body() payload: GHTKWebhookPayload) {
    this.logger.log(`[GHTK Webhook] Nhận payload: ${JSON.stringify(payload)}`);

    // TODO: Implement GHTK webhook handling
    // GHTK có cấu trúc webhook khác với GHN
    await Promise.resolve();

    return { success: true, message: 'GHTK webhook received' };
  }

  // =====================================================================
  // MANUAL TRIGGER ENDPOINTS (DEV ONLY)
  // Dùng để test flow khi GHN không thể gọi webhook trong môi trường local
  // =====================================================================

  /**
   * [DEV] Trigger thủ công cập nhật shipment status
   */
  @Post('dev/simulate-shipment/:shipmentId/:status')
  @ApiOperation({ summary: '[DEV] Simulate shipment status update' })
  async simulateShipmentUpdate(
    @Param('shipmentId') shipmentId: string,
    @Param('status') status: string,
  ) {
    this.logger.log(`[DEV] Simulating shipment ${shipmentId} -> ${status}`);

    const statusMap: Record<string, ShipmentStatus> = {
      pending: ShipmentStatus.PENDING,
      ready: ShipmentStatus.READY_TO_SHIP,
      shipped: ShipmentStatus.SHIPPED,
      delivered: ShipmentStatus.DELIVERED,
      failed: ShipmentStatus.FAILED,
      returned: ShipmentStatus.RETURNED,
    };

    const newStatus = statusMap[status.toLowerCase()];
    if (!newStatus) {
      return { success: false, message: `Invalid status: ${status}` };
    }

    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      return { success: false, message: 'Shipment not found' };
    }

    const updateData: ShipmentUpdateData = { status: newStatus };
    if (newStatus === ShipmentStatus.SHIPPED) updateData.shippedAt = new Date();
    if (newStatus === ShipmentStatus.DELIVERED)
      updateData.deliveredAt = new Date();

    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
    });

    return { success: true, shipmentId, newStatus };
  }

  /**
   * [DEV] Trigger thủ công cập nhật order status
   * Điều này sẽ kích hoạt auto-earn loyalty points nếu status = DELIVERED
   */
  @Post('dev/simulate-order/:orderId/:status')
  @ApiOperation({
    summary: '[DEV] Simulate order status update (triggers auto-earn)',
  })
  async simulateOrderUpdate(
    @Param('orderId') orderId: string,
    @Param('status') status: string,
  ) {
    this.logger.log(`[DEV] Simulating order ${orderId} -> ${status}`);

    // Chỉ cập nhật status trong DB, không trigger full OrdersService.updateStatus
    // để tránh phức tạp. Auto-earn được test riêng.
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    return {
      success: true,
      message:
        'Để test auto-earn, hãy gọi API /loyalty/admin/earn-from-order/:orderId',
      orderId,
    };
  }
}
