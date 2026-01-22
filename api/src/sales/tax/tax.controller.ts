import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { TaxService } from './tax.service';
import { CreateTaxRateDto, UpdateTaxRateDto, ApplyTaxDto } from './dto/tax.dto';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/identity/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { getTenant } from '@/core/tenant/tenant.context';

import { AppPermission } from '@/common/enums/permissions.enum';

@ApiTags('Tax')
@ApiBearerAuth()
@Controller('admin/tax')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(AppPermission.TAX_MANAGE)
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post('rates')
  @ApiOperation({ summary: 'Tạo mức thuế mới' })
  @ApiResponse({ status: 201, description: 'Mức thuế đã được tạo' })
  createTaxRate(@Body() dto: CreateTaxRateDto) {
    const tenant = getTenant();
    return this.taxService.createTaxRate(tenant!.id, dto);
  }

  @Get('rates')
  @ApiOperation({ summary: 'Lấy danh sách mức thuế' })
  getTaxRates() {
    const tenant = getTenant();
    return this.taxService.getTaxRates(tenant!.id);
  }

  @Get('rates/active')
  @ApiOperation({ summary: 'Lấy danh sách mức thuế đang active' })
  getActiveTaxRates() {
    const tenant = getTenant();
    return this.taxService.getActiveTaxRates(tenant!.id);
  }

  @Get('rates/:id')
  @ApiOperation({ summary: 'Lấy chi tiết mức thuế' })
  getTaxRateById(@Param('id') id: string) {
    const tenant = getTenant();
    return this.taxService.getTaxRateById(tenant!.id, id);
  }

  @Put('rates/:id')
  @ApiOperation({ summary: 'Cập nhật mức thuế' })
  updateTaxRate(@Param('id') id: string, @Body() dto: UpdateTaxRateDto) {
    const tenant = getTenant();
    return this.taxService.updateTaxRate(tenant!.id, id, dto);
  }

  @Delete('rates/:id')
  @ApiOperation({ summary: 'Xóa mức thuế' })
  deleteTaxRate(@Param('id') id: string) {
    const tenant = getTenant();
    return this.taxService.deleteTaxRate(tenant!.id, id);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Áp dụng thuế vào đơn hàng' })
  @ApiResponse({ status: 201, description: 'Thuế đã được áp dụng' })
  applyTaxToOrder(@Body() dto: ApplyTaxDto) {
    const tenant = getTenant();
    return this.taxService.applyTaxToOrder(tenant!.id, dto);
  }

  @Get('orders/:orderId/details')
  @ApiOperation({ summary: 'Lấy chi tiết thuế của đơn hàng' })
  getOrderTaxDetails(@Param('orderId') orderId: string) {
    const tenant = getTenant();
    return this.taxService.getOrderTaxDetails(tenant!.id, orderId);
  }

  @Delete('details/:id')
  @ApiOperation({ summary: 'Xóa chi tiết thuế' })
  removeOrderTaxDetail(@Param('id') id: string) {
    const tenant = getTenant();
    return this.taxService.removeOrderTaxDetail(tenant!.id, id);
  }
}

