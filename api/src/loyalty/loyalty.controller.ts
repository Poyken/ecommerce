import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import {
  EarnPointsDto,
  RedeemPointsDto,
  RefundPointsDto,
} from './dto/loyalty.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import {
  RequirePermissions,
  Public,
} from '@/common/decorators/crud.decorators';
import { getTenant } from '@/core/tenant/tenant.context';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  // =====================================================================
  // ADMIN ENDPOINTS
  // =====================================================================

  @Post('admin/earn')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('admin:all')
  earnPoints(@Body() dto: EarnPointsDto) {
    const tenant = getTenant();
    return this.loyaltyService.earnPoints(tenant!.id, dto);
  }

  @Post('admin/redeem')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('admin:all')
  redeemPoints(@Body() dto: RedeemPointsDto) {
    const tenant = getTenant();
    return this.loyaltyService.redeemPoints(tenant!.id, dto);
  }

  @Post('admin/refund')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('admin:all')
  refundPoints(@Body() dto: RefundPointsDto) {
    const tenant = getTenant();
    return this.loyaltyService.refundPoints(tenant!.id, dto);
  }

  @Post('admin/earn-from-order/:orderId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('admin:all')
  earnPointsFromOrder(@Param('orderId') orderId: string) {
    const tenant = getTenant();
    return this.loyaltyService.earnPointsFromOrder(tenant!.id, orderId);
  }

  // =====================================================================
  // USER ENDPOINTS
  // =====================================================================

  @Get('users/:userId/balance')
  getUserBalance(@Param('userId') userId: string) {
    const tenant = getTenant();
    return this.loyaltyService.getUserPointBalance(tenant!.id, userId);
  }

  @Get('users/:userId/history')
  getUserHistory(@Param('userId') userId: string) {
    const tenant = getTenant();
    return this.loyaltyService.getUserPointHistory(tenant!.id, userId);
  }

  @Get('orders/:orderId')
  getOrderPoints(@Param('orderId') orderId: string) {
    return this.loyaltyService.getOrderPoints(orderId);
  }
}
