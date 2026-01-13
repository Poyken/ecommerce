import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

@Injectable()
export class BrandsExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportToExcel(res: Response) {
    const brands = await this.prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Brands');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Product Count', key: 'productCount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 25 },
    ];

    brands.forEach((brand) => {
      worksheet.addRow({
        id: brand.id,
        name: brand.name,
        productCount: brand._count.products,
        status: brand.deletedAt ? 'INACTIVE' : 'ACTIVE',
        createdAt: brand.createdAt.toISOString(),
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=brands_export.xlsx',
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
