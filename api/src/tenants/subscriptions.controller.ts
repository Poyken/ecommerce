import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';
import { BillingFrequency, TenantPlan } from '@prisma/client';

class UpgradePlanDto {
  plan: TenantPlan;
  frequency: BillingFrequency;
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current subscription details' })
  async getCurrentSubscription(@Request() req: any) {
    // Assuming tenantId is attached to user via JwtStrategy (which we did earlier)
    const tenantId = req.user.tenantId;
    return this.subscriptionsService.getCurrentSubscription(tenantId);
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade tenant plan' })
  async upgradePlan(@Request() req: any, @Body() dto: UpgradePlanDto) {
    const tenantId = req.user.tenantId;
    return this.subscriptionsService.upgradePlan(
      tenantId,
      dto.plan,
      dto.frequency,
    );
  }
}
