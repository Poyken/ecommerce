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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ProcurementService } from './procurement.service';
import {
  CreateSupplierDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
} from './dto/procurement.dto';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';

import { AppPermission } from '@/common/enums/permissions.enum';

@ApiTags('Procurement')
@ApiBearerAuth()
@Controller('admin/procurement')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(AppPermission.PROCUREMENT_MANAGE)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Post('suppliers')
  @ApiOperation({ summary: 'Tạo nhà cung cấp mới' })
  @ApiResponse({ status: 201, description: 'Nhà cung cấp đã được tạo' })
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.procurementService.createSupplier(dto);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'Lấy danh sách nhà cung cấp' })
  getSuppliers() {
    return this.procurementService.getSuppliers();
  }

  @Post('purchase-orders')
  @ApiOperation({ summary: 'Tạo đơn nhập hàng mới' })
  @ApiResponse({ status: 201, description: 'Đơn nhập hàng đã được tạo' })
  createPurchaseOrder(@Request() req, @Body() dto: CreatePurchaseOrderDto) {
    return this.procurementService.createPurchaseOrder(req.user.id, dto);
  }

  @Get('purchase-orders')
  @ApiOperation({ summary: 'Lấy danh sách đơn nhập hàng' })
  getPurchaseOrders() {
    return this.procurementService.getPurchaseOrders();
  }

  @Put('purchase-orders/:id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn nhập hàng' })
  @ApiResponse({ status: 200, description: 'Trạng thái đã được cập nhật' })
  updateOrderStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
  ) {
    return this.procurementService.updateOrderStatus(req.user.id, id, dto);
  }
}

