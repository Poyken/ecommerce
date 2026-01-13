import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import {
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from './dto/procurement.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';

@Controller('admin/procurement')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('admin:all') // Hoặc permission cụ thể nếu có
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('suppliers')
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.procurementService.createSupplier(dto);
  }

  @Get('suppliers')
  getSuppliers() {
    return this.procurementService.getSuppliers();
  }

  @Post('purchase-orders')
  createPurchaseOrder(@Request() req, @Body() dto: CreatePurchaseOrderDto) {
    return this.procurementService.createPurchaseOrder(req.user.id, dto);
  }

  @Get('purchase-orders')
  getPurchaseOrders() {
    return this.procurementService.getPurchaseOrders();
  }

  @Put('purchase-orders/:id/status')
  updateOrderStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
  ) {
    return this.procurementService.updateOrderStatus(req.user.id, id, dto);
  }
}
