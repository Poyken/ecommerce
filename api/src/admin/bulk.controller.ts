import { Permissions } from '@/auth/decorators/permissions.decorator';
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
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MASS OPERATIONS (Thao tác quy mô lớn):
 * - Dùng để Admin cập nhật hàng ngàn sản phẩm, kho hàng hoặc giá cả cùng lúc thông qua CSV/Excel.
 * - Tránh việc phải sửa từng cái một trên giao diện Web, giúp tiết kiệm thời gian.
 *
 * 2. DRY RUN (Chế độ chạy thử):
 * - Khi Import, ta có option `dryRun`. Nếu bật, hệ thống chỉ CHECK lỗi (data hợp lệ không, category có tồn tại không...) mà KHÔNG ghi vào DB.
 * - Admin nên chạy dry-run trước khi thực hiện thật để tránh hỏng dữ liệu.
 *
 * 3. EXCEL/CSV STREAMING:
 * - Khi xuất dữ liệu lớn, ta dùng streaming để gửi dữ liệu về client theo từng đoạn, tránh việc server bị treo khi xử lý quá nhiều dòng.
 * =====================================================================
 */
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

  @Get('export/skus/excel')
  @Permissions('sku:read')
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
  @Permissions('sku:read')
  @ApiOperation({ summary: 'Xuất danh sách SKU ra JSON' })
  async exportSkusJson() {
    const data = await this.bulkService.exportSkus();
    return { data };
  }

  @Post('import/skus')
  @Permissions('sku:update')
  @ApiOperation({ summary: 'Nhập dữ liệu SKU từ JSON (có hỗ trợ dry-run)' })
  async importSkus(@Body() body: ImportSkusDto) {
    return this.bulkService.importSkus(body.rows, body.dryRun);
  }

  @Post('import/skus/excel')
  @Permissions('sku:update')
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
    return this.bulkService.importSkusFromExcel(file.buffer, isDryRun);
  }

  @Post('update')
  @Permissions('sku:update')
  @ApiOperation({ summary: 'Cập nhật giá/tồn kho hàng loạt' })
  async bulkUpdate(@Body() dto: BulkUpdateDto) {
    return this.bulkService.bulkUpdate(dto);
  }
}
