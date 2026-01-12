/**
 * =====================================================================
 * INVOICES MODULE - Module Hóa đơn (SaaS Billing)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PHẠM VI:
 * - Module này quản lý hóa đơn thanh toán PHÍ THUÊ BAO (Subscription)
 *   của các Tenant trả cho SuperAdmin.
 * - KHÔNG PHẢI hóa đơn bán hàng lẻ của từng shop (đó là module `Orders`).
 *
 * 2. CẤU TRÚC:
 * - Export `InvoicesService` để các module khác (như `WebhookModule` của Stripe)
 *   có thể gọi hàm tạo hóa đơn khi thanh toán thành công. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PrismaModule } from '@core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
