/**
 * =====================================================================
 * INVOICES CONTROLLER (SUPER ADMIN)
 * =====================================================================
 *
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
