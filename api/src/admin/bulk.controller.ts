import { RequirePermissions } from '@/common/decorators/crud.decorators';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { PermissionsGuard } from '@/auth/permissions.guard';
import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BulkService } from './bulk.service';
import { BulkUpdateDto, ImportSkusDto } from './dto/bulk.dto';

/**
 * =====================================================================
 * BULK CONTROLLER - QUẢN LÝ THAO TÁC HÀNG LOẠT (DÀNH CHO ADMIN)
 * =====================================================================
 */
@ApiTags('Admin - Bulk Operations')
@Controller('admin/bulk')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  @Get('export/skus')
  @RequirePermissions('sku:read')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=skus-export.csv')
  @ApiOperation({ summary: 'Xuất danh sách SKU ra CSV' })
  async exportSkus(): Promise<string> {
    return this.bulkService.exportSkusToCsv();
  }

  @Get('export/skus/excel')
  @RequirePermissions('sku:read')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @Header('Content-Disposition', 'attachment; filename=skus-export.xlsx')
  @ApiOperation({ summary: 'Xuất danh sách SKU ra Excel (XLSX)' })
  async exportSkusExcel(): Promise<Buffer> {
    return this.bulkService.exportSkusToExcel();
  }

  @Get('export/skus/json')
  @RequirePermissions('sku:read')
  @ApiOperation({ summary: 'Xuất danh sách SKU ra JSON' })
  async exportSkusJson() {
    const data = await this.bulkService.exportSkus();
    return { data };
  }

  @Post('import/skus')
  @RequirePermissions('sku:update')
  @ApiOperation({ summary: 'Nhập dữ liệu SKU từ JSON (có hỗ trợ dry-run)' })
  async importSkus(@Body() body: ImportSkusDto) {
    const result = await this.bulkService.importSkus(body.rows, body.dryRun);
    return { data: result };
  }

  @Post('import/skus/excel')
  @RequirePermissions('sku:update')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        dryRun: {
          type: 'boolean',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Nhập dữ liệu SKU từ Excel' })
  async importSkusExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body('dryRun') dryRun?: string, // Multer returns body as string
  ) {
    // Parse dryRun boolean from string
    const isDryRun = dryRun === 'true';
    const result = await this.bulkService.importSkusFromExcel(
      file.buffer,
      isDryRun,
    );
    return { data: result };
  }

  @Post('update')
  @RequirePermissions('sku:update')
  @ApiOperation({ summary: 'Cập nhật giá/tồn kho hàng loạt' })
  async bulkUpdate(@Body() dto: BulkUpdateDto) {
    const result = await this.bulkService.bulkUpdate(dto);
    return { data: result };
  }
}
