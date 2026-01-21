/**
 * =====================================================================
 * MARKETING MODULE - Domain Module cho Tiếp thị và Khách hàng thân thiết
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Domain Module này gộp các module liên quan đến Marketing:
 * - PromotionsModule: Quản lý Khuyến mãi
 * - LoyaltyModule: Quản lý Điểm thưởng và Hạng thành viên
 * - CustomerGroupsModule: Quản lý Nhóm khách hàng
 *
 * 🎯 LỢI ÍCH:
 * - Gom nhóm logic liên quan đến thúc đẩy doanh số và giữ chân khách hàng
 * - Đơn giản hóa AppModule
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
