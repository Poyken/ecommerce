import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { getTenant } from '@/core/tenant/tenant.context';
import { BillingFrequency } from '@prisma/client';

import { AppPermission } from '@/common/enums/permissions.enum';

class PurchasePlanDto {
  planId: string;
  frequency: BillingFrequency;
  paymentMethod: string;
  returnUrl?: string;
}

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /**
   * Public endpoint - Lấy danh sách gói dịch vụ
   */
  @Get('plans')
  @ApiOperation({ summary: 'Lấy danh sách gói dịch vụ' })
  getPlans() {
    return this.subscriptionService.getPlans();
  }

  /**
   * Public endpoint - Lấy chi tiết gói
   */
  @Get('plans/:idOrSlug')
  @ApiOperation({ summary: 'Lấy chi tiết gói dịch vụ' })
  getPlan(@Param('idOrSlug') idOrSlug: string) {
    return this.subscriptionService.getPlan(idOrSlug);
  }

  /**
   * Admin endpoint - Lấy subscription hiện tại của tenant
   */
  @Get('current')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(AppPermission.SUBSCRIPTION_READ)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy subscription hiện tại' })
  getCurrentSubscription() {
    const tenant = getTenant();
    return this.subscriptionService.getCurrentSubscription(tenant!.id);
  }

  /**
   * Admin endpoint - Mua gói dịch vụ
   */
  @Post('purchase')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(AppPermission.SUBSCRIPTION_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mua gói dịch vụ' })
  purchasePlan(@Body() dto: PurchasePlanDto) {
    const tenant = getTenant();
    return this.subscriptionService.purchasePlan(
      tenant!.id,
      dto.planId,
      dto.frequency,
      dto.paymentMethod,
      dto.returnUrl,
    );
  }

  /**
   * Admin endpoint - Gia hạn subscription
   */
  @Post('renew')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(AppPermission.SUBSCRIPTION_MANAGE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gia hạn subscription' })
  renewSubscription(@Body() body: { returnUrl?: string }) {
    const tenant = getTenant();
    return this.subscriptionService.renewSubscription(
      tenant!.id,
      body.returnUrl,
    );
  }

  /**
   * DEV endpoint - Simulate payment success
   */
  @Post('dev/activate/:subscriptionId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(AppPermission.DEV_TOOLS_ACCESS)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[DEV] Simulate payment success' })
  simulatePaymentSuccess(@Param('subscriptionId') subscriptionId: string) {
    return this.subscriptionService.simulatePaymentSuccess(subscriptionId);
  }
}
