import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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

import { AppPermission } from '@/common/enums/permissions.enum';

@ApiTags('Loyalty')
@ApiBearerAuth()
@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('admin/earn')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_MANAGE)
  @ApiOperation({ summary: '[Admin] Tích điểm cho user' })
  earnPoints(@Body() dto: EarnPointsDto) {
    const tenant = getTenant();
    return this.loyaltyService.earnPoints(tenant!.id, dto);
  }

  @Post('admin/redeem')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_MANAGE)
  redeemPoints(@Body() dto: RedeemPointsDto) {
    const tenant = getTenant();
    return this.loyaltyService.redeemPoints(tenant!.id, dto);
  }

  @Post('admin/refund')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_MANAGE)
  refundPoints(@Body() dto: RefundPointsDto) {
    const tenant = getTenant();
    return this.loyaltyService.refundPoints(tenant!.id, dto);
  }

  @Post('admin/earn-from-order/:orderId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_MANAGE)
  earnPointsFromOrder(@Param('orderId') orderId: string) {
    const tenant = getTenant();
    return this.loyaltyService.earnPointsFromOrder(tenant!.id, orderId);
  }

  // =====================================================================
  // USER ENDPOINTS
  // =====================================================================

  @Get('users/:userId/balance')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_READ)
  getUserBalance(@Param('userId') userId: string) {
    const tenant = getTenant();
    return this.loyaltyService.getUserPointBalance(tenant!.id, userId);
  }

  @Get('users/:userId/history')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_READ)
  getUserHistory(@Param('userId') userId: string) {
    const tenant = getTenant();
    return this.loyaltyService.getUserPointHistory(tenant!.id, userId);
  }

  @Get('orders/:orderId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(AppPermission.LOYALTY_READ)
  getOrderPoints(@Param('orderId') orderId: string) {
    const tenant = getTenant();
    return this.loyaltyService.getOrderPoints(tenant!.id, orderId);
  }
}
