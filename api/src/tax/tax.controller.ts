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
import { TaxService } from './tax.service';
import { CreateTaxRateDto, UpdateTaxRateDto, ApplyTaxDto } from './dto/tax.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { getTenant } from '@/core/tenant/tenant.context';

@Controller('admin/tax')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('admin:all')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  // =====================================================================
  // TAX RATE CRUD
  // =====================================================================

  @Post('rates')
  createTaxRate(@Body() dto: CreateTaxRateDto) {
    const tenant = getTenant();
    return this.taxService.createTaxRate(tenant!.id, dto);
  }

  @Get('rates')
  getTaxRates() {
    const tenant = getTenant();
    return this.taxService.getTaxRates(tenant!.id);
  }

  @Get('rates/active')
  getActiveTaxRates() {
    const tenant = getTenant();
    return this.taxService.getActiveTaxRates(tenant!.id);
  }

  @Get('rates/:id')
  getTaxRateById(@Param('id') id: string) {
    const tenant = getTenant();
    return this.taxService.getTaxRateById(tenant!.id, id);
  }

  @Put('rates/:id')
  updateTaxRate(@Param('id') id: string, @Body() dto: UpdateTaxRateDto) {
    const tenant = getTenant();
    return this.taxService.updateTaxRate(tenant!.id, id, dto);
  }

  @Delete('rates/:id')
  deleteTaxRate(@Param('id') id: string) {
    const tenant = getTenant();
    return this.taxService.deleteTaxRate(tenant!.id, id);
  }

  // =====================================================================
  // ORDER TAX OPERATIONS
  // =====================================================================

  @Post('apply')
  applyTaxToOrder(@Body() dto: ApplyTaxDto) {
    const tenant = getTenant();
    return this.taxService.applyTaxToOrder(tenant!.id, dto);
  }

  @Get('orders/:orderId/details')
  getOrderTaxDetails(@Param('orderId') orderId: string) {
    return this.taxService.getOrderTaxDetails(orderId);
  }

  @Delete('details/:id')
  removeOrderTaxDetail(@Param('id') id: string) {
    return this.taxService.removeOrderTaxDetail(id);
  }
}
