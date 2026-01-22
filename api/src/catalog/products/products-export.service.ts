import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

/**
 * =====================================================================
 * PRODUCTS EXPORT SERVICE - XUẤT DỮ LIỆU SẢN PHẨM RA EXCEL
 * =====================================================================
 *
 * =====================================================================
 */
@Injectable()
export class ProductsExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportToExcel(res: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products & SKUs');

    // Define columns
    worksheet.columns = [
      {
        header: 'Product ID (Leave Empty for New)',
        key: 'productId',
        width: 40,
      },
      { header: 'Product Name (*)', key: 'productName', width: 30 },
      { header: 'Product Slug (Optional)', key: 'productSlug', width: 30 },
      { header: 'Category Name (*)', key: 'category', width: 20 },
      { header: 'Brand Name (*)', key: 'brand', width: 20 },
      { header: 'SKU ID (Leave Empty for New)', key: 'skuId', width: 40 },
      { header: 'SKU Code (*)', key: 'skuCode', width: 20 },
      { header: 'Price (*)', key: 'price', width: 15 },
      { header: 'Sale Price', key: 'salePrice', width: 15 },
      { header: 'Stock (*)', key: 'stock', width: 10 },
      { header: 'Attributes (Ignored)', key: 'attributes', width: 40 },
      { header: 'Status (ACTIVE/INACTIVE)', key: 'status', width: 15 },
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // [P15 OPTIMIZATION] Batch-based streaming to avoid OOM for large catalogs
    const batchSize = 100;
    let cursor: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const products = await (this.prisma.product as any).findMany({
        where: { deletedAt: null },
        take: batchSize,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' }, // Reliable order for cursor
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          brand: true,
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

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      // Add rows for this batch
      for (const product of products) {
        for (const sku of product.skus) {
          const attributes = sku.optionValues
            .map(
              (ov) => `${ov.optionValue.option.name}: ${ov.optionValue.value}`,
            )
            .join(', ');

          worksheet.addRow({
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            category:
              product.categories.map((c) => c.category.name).join(', ') || '',
            brand: product.brand?.name || '',
            skuId: sku.id,
            skuCode: sku.skuCode,
            price: sku.price ? Number(sku.price) : 0,
            salePrice: sku.salePrice ? Number(sku.salePrice) : undefined,
            stock: sku.stock,
            attributes,
            status: sku.status,
          });
        }
      }

      // Update cursor
      cursor = products[products.length - 1].id;
      if (products.length < batchSize) {
        hasMore = false;
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
