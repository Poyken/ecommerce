/**
 * =====================================================================
 * AI INSIGHTS MODULE - TRUNG TÂM PHÂN TÍCH DL CỬA HÀNG
 * =====================================================================
 *
 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';
import { PrismaModule } from '@core/prisma/prisma.module';
// import { AuthModule } from '@/identity/auth/auth.module'; // If needed for guards

@Module({
  imports: [PrismaModule],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
