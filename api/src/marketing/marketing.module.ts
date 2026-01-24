/**
 * =====================================================================
 * MARKETING MODULE - Domain Module cho Tiếp thị và Khách hàng thân thiết
 * =====================================================================
 *
 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { PromotionsModule } from './promotions/promotions.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { CustomerGroupsModule } from './customer-groups/customer-groups.module';

@Module({
  imports: [PromotionsModule, LoyaltyModule, CustomerGroupsModule],
  exports: [PromotionsModule, LoyaltyModule, CustomerGroupsModule],
})
export class MarketingModule {}
