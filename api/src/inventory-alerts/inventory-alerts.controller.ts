import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryAlertsService } from './inventory-alerts.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { getTenant } from '@/core/tenant/tenant.context';

import { AppPermission } from '@/common/enums/permissions.enum';

@ApiTags('Inventory Alerts')
@ApiBearerAuth()
@Controller('admin/inventory-alerts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(AppPermission.INVENTORY_ALERTS_MANAGE)
export class InventoryAlertsController {
  constructor(
    private readonly inventoryAlertsService: InventoryAlertsService,
  ) {}

  @Get('low-stock')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm tồn kho thấp' })
  getLowStockProducts() {
    const tenant = getTenant();
    return this.inventoryAlertsService.getLowStockProducts(tenant!.id);
  }

  @Post('trigger')
  @ApiOperation({ summary: '[DEV] Trigger gửi email cảnh báo tồn kho' })
  triggerAlert() {
    const tenant = getTenant();
    return this.inventoryAlertsService.triggerManualAlert(tenant!.id);
  }
}
