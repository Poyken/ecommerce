import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class ProductsExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportToExcel(res: any) {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: true,
        brand: true,
        options: {
          include: { values: true },
        },
        skus: {
          include: {
            optionValues: {
              include: {
                optionValue: {
                  include: { option: true },
                },
              },
            },
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products & SKUs');

    // Define columns
    worksheet.columns = [
      { header: 'Product ID', key: 'productId', width: 40 },
      { header: 'Product Name', key: 'productName', width: 30 },
      { header: 'Product Slug', key: 'productSlug', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Brand', key: 'brand', width: 20 },
      { header: 'SKU ID', key: 'skuId', width: 40 },
      { header: 'SKU Code', key: 'skuCode', width: 20 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Sale Price', key: 'salePrice', width: 15 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Attributes', key: 'attributes', width: 40 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add rows
    for (const product of products) {
      for (const sku of product.skus) {
        const attributes = sku.optionValues
          .map((ov) => `${ov.optionValue.option.name}: ${ov.optionValue.value}`)
          .join(', ');

        worksheet.addRow({
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          category: product.category?.name || '',
          brand: product.brand?.name || '',
          skuId: sku.id,
          skuCode: sku.skuCode,
          price: sku.price ? Number(sku.price) : 0,
          salePrice: sku.salePrice ? Number(sku.salePrice) : undefined,
          stock: sku.stock,
          attributes,
          status: sku.status,
        } as any);
      }
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `products-export-${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
