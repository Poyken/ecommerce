import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Param,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateWarehouseDto,
  UpdateStockDto,
  TransferStockDto,
} from './dto/inventory.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/identity/auth/jwt-auth.guard';
import { getTenant } from '@core/tenant/tenant.context';

// Use Cases
import { UpdateStockUseCase } from './application/use-cases/update-stock.use-case';
import { TransferStockUseCase } from './application/use-cases/transfer-stock.use-case';
import { CreateWarehouseUseCase } from './application/use-cases/create-warehouse.use-case';
import { GetWarehousesUseCase } from './application/use-cases/get-warehouses.use-case';
import { GetStockBySkuUseCase } from './application/use-cases/get-stock-by-sku.use-case';

@ApiTags('Inventory (Quản lý kho)')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(
    private readonly updateStockUseCase: UpdateStockUseCase,
    private readonly transferStockUseCase: TransferStockUseCase,
    private readonly createWarehouseUseCase: CreateWarehouseUseCase,
    private readonly getWarehousesUseCase: GetWarehousesUseCase,
    private readonly getStockBySkuUseCase: GetStockBySkuUseCase,
  ) {}

  @Post('warehouses')
  @ApiOperation({ summary: 'Tạo kho hàng mới' })
  async createWarehouse(@Body() dto: CreateWarehouseDto) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.createWarehouseUseCase.execute({
      tenantId: tenant.id,
      ...dto,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return { data: result.value.warehouse.toPersistence() };
  }

  @Get('warehouses')
  @ApiOperation({ summary: 'Lấy danh sách kho hàng của tenant' })
  async getWarehouses() {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.getWarehousesUseCase.execute({
      tenantId: tenant.id,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return { data: result.value.warehouses.map((w) => w.toPersistence()) };
  }

  @Post('stock')
  @ApiOperation({ summary: 'Nhập/Xuất kho cho SKU' })
  async updateStock(@Req() req, @Body() dto: UpdateStockDto) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.updateStockUseCase.execute({
      userId: req.user.id,
      tenantId: tenant.id,
      ...dto,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return { data: result.value.inventoryLog.toPersistence() };
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Điều chuyển hàng giữa các kho' })
  async transferStock(@Req() req, @Body() dto: TransferStockDto) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.transferStockUseCase.execute({
      userId: req.user.id,
      tenantId: tenant.id,
      ...dto,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return { success: true };
  }

  @Get('sku/:id')
  @ApiOperation({
    summary: 'Lấy thông tin tồn kho chi tiết của SKU tại các kho',
  })
  async getStockBySku(@Param('id') skuId: string) {
    const tenant = getTenant();
    if (!tenant) throw new BadRequestException('Tenant context missing');

    const result = await this.getStockBySkuUseCase.execute({
      skuId,
      tenantId: tenant.id,
    });

    if (result.isFailure) {
      throw new BadRequestException(result.error.message);
    }

    return { data: result.value.stock.map((s) => s.toPersistence()) };
  }
}
