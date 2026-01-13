import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

@Injectable()
export class CategoriesExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportToExcel(res: Response) {
    const categories = await this.prisma.category.findMany({
      include: {
        parent: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Categories');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Slug', key: 'slug', width: 30 },
      { header: 'Parent Category', key: 'parent', width: 30 },
      { header: 'Product Count', key: 'productCount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 25 },
    ];

    categories.forEach((category) => {
      worksheet.addRow({
        id: category.id,
        name: category.name,
        slug: category.slug,
        parent: category.parent ? category.parent.name : '',
        productCount: category._count.products,
        status: category.deletedAt ? 'INACTIVE' : 'ACTIVE',
        createdAt: category.createdAt.toISOString(),
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=categories_export.xlsx',
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
