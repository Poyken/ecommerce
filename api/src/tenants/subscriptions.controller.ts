/**
 * =====================================================================
 * SUBSCRIPTIONS.CONTROLLER CONTROLLER
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Controller này xử lý các HTTP request từ client.
 *
 * 1. NHIỆM VỤ CHÍNH:
 *    - Nhận request từ client
 *    - Validate dữ liệu đầu vào
 *    - Gọi service xử lý logic
 *    - Trả về response cho client
 *
 * 2. CÁC ENDPOINT:
 *    - [Liệt kê các endpoint]
 * =====================================================================
 */

import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { BillingFrequency, TenantPlan } from '@prisma/client';

import { IsEnum } from 'class-validator';

class UpgradePlanDto {
  @IsEnum(TenantPlan)
  plan: TenantPlan;

  @IsEnum(BillingFrequency)
  frequency: BillingFrequency;
}

import { Permissions } from '@/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@/auth/permissions.guard';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @Permissions('tenant:read')
  @ApiOperation({ summary: 'Get current subscription details' })
  async getCurrentSubscription(@Request() req: any) {
    // Assuming tenantId is attached to user via JwtStrategy (which we did earlier)
    const tenantId = req.user.tenantId;
    return this.subscriptionsService.getCurrentSubscription(tenantId);
  }

  @Get()
  @Permissions('admin:read')
  @ApiOperation({ summary: 'List all subscriptions (Super Admin)' })
  async getAllSubscriptions(@Query() query: any) {
    return this.subscriptionsService.findAll({
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 10,
      search: query.search,
      status: query.status,
    });
  }

  @Post('upgrade')
  @Permissions('tenant:update')
  @ApiOperation({ summary: 'Upgrade tenant plan' })
  async upgradePlan(@Request() req: any, @Body() dto: UpgradePlanDto) {
    const tenantId = req.user.tenantId;
    return this.subscriptionsService.upgradePlan(
      tenantId,
      dto.plan,
      dto.frequency,
    );
  }

  @Post('cancel')
  @Permissions('tenant:update')
  @ApiOperation({ summary: 'Cancel current subscription' })
  async cancelSubscription(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.subscriptionsService.cancelSubscription(tenantId);
  }

  @Post(':tenantId/cancel')
  @Permissions('admin:update')
  @ApiOperation({ summary: 'Cancel specific tenant subscription (Admin)' })
  async cancelTenantSubscription(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.cancelSubscription(tenantId);
  }
}
