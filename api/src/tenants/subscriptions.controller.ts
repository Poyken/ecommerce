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
 *    - [Liệt kê các endpoint] *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  Request,
  Query,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { BillingFrequency, TenantPlan } from '@prisma/client';
import type { RequestWithUser } from '@/auth/interfaces/request-with-user.interface';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { PermissionsGuard } from '@/auth/permissions.guard';
import {
  ApiGetOneResponse,
  ApiListResponse,
  ApiUpdateResponse,
} from '@/common/decorators/crud.decorators';

class UpgradePlanDto {
  @IsEnum(TenantPlan)
  plan: TenantPlan;

  @IsEnum(BillingFrequency)
  frequency: BillingFrequency;
}

class SubscriptionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @IsOptional()
  @IsEnum(BillingFrequency)
  billingFrequency?: BillingFrequency;

  @IsOptional()
  @IsString()
  status?: string;
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @RequirePermissions('tenant:read')
  @ApiGetOneResponse('Subscription', {
    summary: 'Get current subscription details',
  })
  async getCurrentSubscription(@Request() req: RequestWithUser) {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    const result =
      await this.subscriptionsService.getCurrentSubscription(tenantId);
    return { data: result };
  }

  @Get()
  @RequirePermissions('admin:read')
  @ApiListResponse('Subscription', {
    summary: 'List all subscriptions (Super Admin)',
  })
  async getAllSubscriptions(@Query() query: SubscriptionQueryDto) {
    const result = await this.subscriptionsService.findAll({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      search: query.search,
      status: query.status,
    });
    return result; // Result already has { data, meta }
  }

  @Post('upgrade')
  @RequirePermissions('tenant:update')
  @ApiUpdateResponse('Subscription', { summary: 'Upgrade tenant plan' })
  async upgradePlan(
    @Request() req: RequestWithUser,
    @Body() dto: UpgradePlanDto,
  ) {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    const result = await this.subscriptionsService.upgradePlan(
      tenantId,
      dto.plan,
      dto.frequency,
    );
    return { data: result };
  }

  @Post('cancel')
  @RequirePermissions('tenant:update')
  @ApiUpdateResponse('Subscription', { summary: 'Cancel current subscription' })
  async cancelSubscription(@Request() req: RequestWithUser) {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }
    const result = await this.subscriptionsService.cancelSubscription(tenantId);
    return { data: result };
  }

  @Post(':tenantId/cancel')
  @RequirePermissions('admin:update')
  @ApiUpdateResponse('Subscription', {
    summary: 'Cancel specific tenant subscription (Admin)',
  })
  async cancelTenantSubscription(@Param('tenantId') tenantId: string) {
    const result = await this.subscriptionsService.cancelSubscription(tenantId);
    return { data: result };
  }

  @Post(':id')
  @RequirePermissions('admin:update')
  @ApiUpdateResponse('Subscription', { summary: 'Update subscription details' })
  async updateSubscription(
    @Param('id') id: string,
    @Body() body: UpdateSubscriptionDto,
  ) {
    const result = await this.subscriptionsService.update(id, body);
    return { data: result };
  }

  @Delete(':id')
  @RequirePermissions('admin:delete')
  @ApiUpdateResponse('Subscription', { summary: 'Delete subscription' })
  async removeSubscription(@Param('id') id: string) {
    const result = await this.subscriptionsService.remove(id);
    return { data: result };
  }
}
