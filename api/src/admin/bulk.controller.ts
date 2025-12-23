import { Body, Controller, Get, Header, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { BulkService } from './bulk.service';
import { BulkUpdateDto, ImportSkusDto } from './dto/bulk.dto';

@ApiTags('Bulk Operations')
@Controller('admin/bulk')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  @Get('export/skus')
  @Permissions('sku:read')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=skus-export.csv')
  @ApiOperation({ summary: 'Xuất danh sách SKU ra CSV' })
  async exportSkus(): Promise<string> {
    return this.bulkService.exportSkusToCsv();
  }

  @Get('export/skus/json')
  @Permissions('sku:read')
  @ApiOperation({ summary: 'Xuất danh sách SKU ra JSON' })
  async exportSkusJson() {
    const data = await this.bulkService.exportSkus();
    return { data };
  }

  @Post('import/skus')
  @Permissions('sku:update')
  @ApiOperation({ summary: 'Nhập dữ liệu SKU từ JSON' })
  async importSkus(@Body() body: ImportSkusDto) {
    return this.bulkService.importSkus(body.rows);
  }

  @Post('update')
  @Permissions('sku:update')
  @ApiOperation({ summary: 'Cập nhật giá/tồn kho hàng loạt' })
  async bulkUpdate(@Body() dto: BulkUpdateDto) {
    return this.bulkService.bulkUpdate(dto);
  }
}
