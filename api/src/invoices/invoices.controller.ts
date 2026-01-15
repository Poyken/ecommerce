/**
 * =====================================================================
 * INVOICES CONTROLLER (SUPER ADMIN)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SCOPE:
 * - Controller này chỉ dành cho SuperAdmin để xem doanh thu từ việc cho thuê phần mềm.
 * - Tenant (Chủ shop) sẽ xem hóa đơn của họ ở một Controller khác (hoặc filter theo tenantId).
 *
 * 2. PAGINATION:
 * - API List luôn cần phân trang (`page`, `limit`) để tránh load hàng nghìn hóa đơn cùng lúc
 *   gây sập DB. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
import { Controller, Get, Param, Patch, Query, Body } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    return this.invoicesService.findAllSuperAdmin(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.invoicesService.updateStatus(id, status);
  }
}
