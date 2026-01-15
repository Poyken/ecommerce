import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { createSlug } from '@/common/utils/string';

@Injectable()
export class CategoriesImportService {
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

    // Prefetch for mapping
    const allCategories = await this.prisma.category.findMany({
      where: { tenantId },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(
      allCategories.map((c) => [c.name.toLowerCase(), c.id]),
    );

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      rows.push(row);
    });

    for (const row of rows) {
      results.total++;
      try {
        const name = (row.getCell(2).value || '').toString();
        const slug =
          (row.getCell(3).value || '').toString() || createSlug(name);
        const parentName = (row.getCell(4).value || '').toString();
        const status = (row.getCell(6).value || 'ACTIVE').toString();

        if (!name) throw new Error('Tên danh mục là bắt buộc');

        const parentId = parentName
          ? categoryMap.get(parentName.toLowerCase())
          : null;

        await this.prisma.category.upsert({
          where: {
            tenantId_slug: { tenantId, slug },
          } as any,
          update: {
            name,
            parentId,
            deletedAt: status === 'INACTIVE' ? new Date() : null,
          },
          create: {
            name,
            slug,
            parentId,
            tenantId,
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
      if (!name) errors.push('Thiếu tên danh mục');

      previewData.push({
        name,
        slug: ((row.getCell(3).value as any) || '').toString(),
        status: ((row.getCell(6).value as any) || 'ACTIVE').toString(),
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
      { header: 'Slug (Optional)', key: 'slug', width: 30 },
      { header: 'Parent Category Name', key: 'parentName', width: 30 },
      { header: 'Image URL', key: 'imageUrl', width: 30 },
      { header: 'Status (ACTIVE/INACTIVE)', key: 'status', width: 20 },
    ];

    worksheet.addRow({
      name: 'Electronics',
      slug: 'electronics',
      status: 'ACTIVE',
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=categories_import_template.xlsx',
    );
    await workbook.xlsx.write(res);
    res.end();
  }
}
