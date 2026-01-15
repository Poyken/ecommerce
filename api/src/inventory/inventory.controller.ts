import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateWarehouseDto, UpdateStockDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
// import { RequirePermissions } from '@/common/decorators/crud.decorators';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('warehouses')
  //   @RequirePermissions('inventory:manage')
  async createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(dto);
  }

  @Get('warehouses')
  async getWarehouses() {
    return this.inventoryService.getWarehouses();
  }

  @Post('stock')
  //   @RequirePermissions('inventory:manage')
  async updateStock(@Req() req, @Body() dto: UpdateStockDto) {
    return this.inventoryService.updateStock(req.user.id, dto);
  }

  @Get('sku/:id')
  async getStockBySku(@Param('id') skuId: string) {
    return this.inventoryService.getStockBySku(skuId);
  }
}
