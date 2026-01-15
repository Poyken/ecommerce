import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { createSlug } from '@/common/utils/string';

@Injectable()
export class BrandsImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importFromExcel(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new BadRequestException('File Excel không hợp lệ');
    }

    const tenantId = getTenant()?.id;
    if (!tenantId) throw new BadRequestException('Tenant not found');

    const results = { total: 0, success: 0, failed: 0, errors: [] as any[] };

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      rows.push(row);
    });

    for (const row of rows) {
      results.total++;
      try {
        const name = String(row.getCell(2).value || '');
        const status = String(row.getCell(4).value || 'ACTIVE');
        const slug = createSlug(name);

        if (!name) throw new Error('Tên thương hiệu là bắt buộc');

        await this.prisma.brand.upsert({
          where: {
            tenantId_name: { name, tenantId },
          },
          update: {
            deletedAt: status === 'INACTIVE' ? new Date() : null,
          },
          create: {
            name,
            slug,
            tenantId: tenantId as any,
            deletedAt: status === 'INACTIVE' ? new Date() : null,
          },
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ row: row.number, error: error.message });
      }
    }

    return results;
  }

  async previewFromExcel(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);
    const previewData: any[] = [];

    if (!worksheet) {
      throw new BadRequestException('File Excel không hợp lệ');
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const nameValue = row.getCell(2).value;
      const name =
        nameValue !== null && nameValue !== undefined
          ? (nameValue as any).toString()
          : '';
      const errors: string[] = [];
      if (!name) errors.push('Thiếu tên thương hiệu');

      previewData.push({
        name,
        status: ((row.getCell(4).value as any) || 'ACTIVE').toString(),
        rowNumber,
        isValid: errors.length === 0,
        errors,
      });
    });

    return previewData;
  }

  async generateTemplate(res: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');

    worksheet.columns = [
      { header: 'ID (Leave empty for new)', key: 'id', width: 30 },
      { header: 'Name (*)', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Status (ACTIVE/INACTIVE)', key: 'status', width: 20 },
    ];

    worksheet.addRow({
      name: 'Apple',
      description: 'Tech giant',
      status: 'ACTIVE',
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=brands_import_template.xlsx',
    );
    await workbook.xlsx.write(res);
    res.end();
  }
}
