import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { PlanUsageService } from './plan-usage.service';
import { SubscriptionsService } from './subscriptions.service';

import { SubscriptionsController } from './subscriptions.controller';

@Module({
  controllers: [TenantsController, SubscriptionsController],
  providers: [TenantsService, PlanUsageService, SubscriptionsService],
  exports: [TenantsService, PlanUsageService, SubscriptionsService],
})
export class TenantsModule {}
