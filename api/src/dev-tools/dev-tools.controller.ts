import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Logger,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '@/core/prisma/prisma.service';
import { OrderStatus, ShipmentStatus, PaymentStatus } from '@prisma/client';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { getTenant } from '@/core/tenant/tenant.context';
import { LoyaltyService } from '@/loyalty/loyalty.service';

/**
 * =====================================================================
 * DEV TOOLS CONTROLLER - TESTING TRONG MÔI TRƯỜNG DEVELOPMENT
 * =====================================================================
 *
 * Controller này chứa các endpoints để simulate các callback/webhook
 * không thể gọi trong môi trường local (GHN, VNPAY, MoMo, etc.)
 *
 * ⚠️ CHỈ DÙNG CHO MÔI TRƯỜNG DEVELOPMENT/TESTING
 * =====================================================================
 */
import { AppPermission } from '@/common/enums/permissions.enum';

@ApiTags('Dev Tools')
@ApiBearerAuth()
@Controller('dev-tools')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(AppPermission.DEV_TOOLS_ACCESS)
export class DevToolsController {
  private readonly logger = new Logger(DevToolsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  // =====================================================================
  // GHN SIMULATION
  // =====================================================================

  /**
   * Simulate GHN webhook callback - Cập nhật shipment status
   */
  @Post('simulate-ghn/:shipmentId/:status')
  @ApiOperation({ summary: '[DEV] Simulate GHN webhook cho shipment' })
  async simulateGHNWebhook(
    @Param('shipmentId') shipmentId: string,
    @Param('status') status: 'picked' | 'delivering' | 'delivered' | 'returned',
  ) {
    this.logger.log(`[DEV] Simulating GHN webhook: ${shipmentId} -> ${status}`);

    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true },
    });

    if (!shipment) {
      return { success: false, message: 'Shipment not found' };
    }

    const statusMap: Record<string, ShipmentStatus> = {
      picked: ShipmentStatus.SHIPPED,
      delivering: ShipmentStatus.SHIPPED,
      delivered: ShipmentStatus.DELIVERED,
      returned: ShipmentStatus.RETURNED,
    };

    const newStatus = statusMap[status];
    const updateData: any = { status: newStatus };

    if (newStatus === ShipmentStatus.SHIPPED) {
      updateData.shippedAt = new Date();
    }
    if (newStatus === ShipmentStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }

    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
    });

    return { success: true, shipmentId, status: newStatus };
  }

  // =====================================================================
  // ORDER FLOW SIMULATION
  // =====================================================================

  /**
   * Trigger full flow: Order -> DELIVERED -> Auto-earn loyalty points
   */
  @Post('trigger-order-delivered/:orderId')
  @ApiOperation({ summary: '[DEV] Trigger Order DELIVERED + Auto-earn points' })
  async triggerOrderDelivered(@Param('orderId') orderId: string) {
    this.logger.log(`[DEV] Triggering order ${orderId} -> DELIVERED`);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    // Update order status to DELIVERED
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED },
    });

    // Trigger auto-earn loyalty points
    const tenant = getTenant();
    let earnedPoints = 0;
    if (tenant) {
      try {
        const result = await this.loyaltyService.earnPointsFromOrder(
          tenant.id,
          orderId,
        );
        earnedPoints = result?.amount ?? 0;
      } catch (error) {
        this.logger.error(`Error earning points: ${(error as any).message}`);
      }
    }

    return {
      success: true,
      orderId,
      newStatus: OrderStatus.DELIVERED,
      loyaltyPoints: earnedPoints,
    };
  }

  // =====================================================================
  // PAYMENT SIMULATION
  // =====================================================================

  /**
   * Simulate VNPAY payment callback
   */
  @Post('simulate-vnpay-callback/:orderId')
  @ApiOperation({ summary: '[DEV] Simulate VNPAY payment callback' })
  async simulateVNPayCallback(
    @Param('orderId') orderId: string,
    @Body() body: { success: boolean; transactionId?: string },
  ) {
    this.logger.log(
      `[DEV] Simulating VNPAY callback: ${orderId} -> ${body.success}`,
    );

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    const paymentStatus = body.success ? 'PAID' : 'FAILED';

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: paymentStatus as any,
        transactionId: body.transactionId || `DEV-${Date.now()}`,
      },
    });

    // Update payment record if exists
    await this.prisma.payment.updateMany({
      where: { orderId },
      data: {
        status: paymentStatus,
        providerTransactionId: body.transactionId || `DEV-${Date.now()}`,
      },
    });

    return { success: true, orderId, paymentStatus };
  }

  /**
   * Simulate MoMo payment callback
   */
  @Post('simulate-momo-callback/:orderId')
  @ApiOperation({ summary: '[DEV] Simulate MoMo payment callback' })
  async simulateMoMoCallback(
    @Param('orderId') orderId: string,
    @Body() body: { success: boolean; transactionId?: string },
  ) {
    this.logger.log(
      `[DEV] Simulating MoMo callback: ${orderId} -> ${body.success}`,
    );

    // Same logic as VNPAY
    return this.simulateVNPayCallback(orderId, body);
  }

  // =====================================================================
  // STATUS OVERVIEW
  // =====================================================================

  /**
   * Get dev tools status and available endpoints
   */
  @Get('status')
  @ApiOperation({ summary: '[DEV] Get available dev tools endpoints' })
  async getDevToolsStatus() {
    return {
      environment: process.env.NODE_ENV,
      availableEndpoints: [
        'POST /dev-tools/simulate-ghn/:shipmentId/:status',
        'POST /dev-tools/trigger-order-delivered/:orderId',
        'POST /dev-tools/simulate-vnpay-callback/:orderId',
        'POST /dev-tools/simulate-momo-callback/:orderId',
      ],
      warning: 'These endpoints are for DEVELOPMENT/TESTING only!',
    };
  }
}
