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
import {
  CreateWarehouseDto,
  UpdateStockDto,
  TransferStockDto,
} from './dto/inventory.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
// import { RequirePermissions } from '@/common/decorators/crud.decorators';

@ApiTags('Inventory (Quản lý kho)')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('warehouses')
  @ApiOperation({ summary: 'Tạo kho hàng mới' })
  async createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(dto);
  }

  @Get('warehouses')
  @ApiOperation({ summary: 'Lấy danh sách kho hàng của tenant' })
  async getWarehouses() {
    return this.inventoryService.getWarehouses();
  }

  @Post('stock')
  @ApiOperation({ summary: 'Nhập/Xuất kho cho SKU' })
  async updateStock(@Req() req, @Body() dto: UpdateStockDto) {
    return this.inventoryService.updateStock(req.user.id, dto);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Điều chuyển hàng giữa các kho' })
  async transferStock(@Req() req, @Body() dto: TransferStockDto) {
    return this.inventoryService.transferStock(req.user.id, dto);
  }

  @Get('sku/:id')
  @ApiOperation({
    summary: 'Lấy thông tin tồn kho chi tiết của SKU tại các kho',
  })
  async getStockBySku(@Param('id') skuId: string) {
    const stock = await this.inventoryService.getStockBySku(skuId);
    return { data: stock };
  }
}

