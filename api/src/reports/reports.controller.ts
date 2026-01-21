import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { getTenant } from '@/core/tenant/tenant.context';

import { AppPermission } from '@/common/enums/permissions.enum';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(AppPermission.REPORTS_EXPORT)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('orders/export')
  @ApiOperation({ summary: 'Export đơn hàng' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportOrders(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenant = getTenant();
    return this.reportsService.exportOrdersToExcel(
      tenant!.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('inventory/export')
  @ApiOperation({ summary: 'Export tồn kho' })
  async exportInventory() {
    const tenant = getTenant();
    return this.reportsService.exportInventoryToExcel(tenant!.id);
  }

  @Get('tax/export')
  @ApiOperation({ summary: 'Export báo cáo thuế' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async exportTaxReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const tenant = getTenant();
    return this.reportsService.exportTaxReportToExcel(
      tenant!.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}

