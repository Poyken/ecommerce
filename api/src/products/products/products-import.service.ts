import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from 'src/prisma/prisma.service';
import { SkuManagerService } from './sku-manager.service';

@Injectable()
export class ProductsImportService {
  private readonly logger = new Logger(ProductsImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly skuManager: SkuManagerService,
  ) {}

  async importFromExcel(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new BadRequestException('File Excel không hợp lệ');
    }

    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const rowData = {
        productId: row.getCell(1).value?.toString(),
        productName: row.getCell(2).value?.toString(),
        productSlug: row.getCell(3).value?.toString(),
        categoryName: row.getCell(4).value?.toString(),
        brandName: row.getCell(5).value?.toString(),
        skuId: row.getCell(6).value?.toString(),
        skuCode: row.getCell(7).value?.toString(),
        price: Number(row.getCell(8).value),
        salePrice: row.getCell(9).value ? Number(row.getCell(9).value) : null,
        stock: Number(row.getCell(10).value),
        status: row.getCell(12).value?.toString() || 'ACTIVE',
      };
      rows.push(rowData);
    });

    const results = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [] as { key: string; error: any }[],
    };

    // Group by Product to avoid redundant product upserts
    const groupedByProduct = rows.reduce((acc, row) => {
      const key = row.productId || row.productSlug;
      if (!acc[key]) acc[key] = { info: row, skus: [] };
      acc[key].skus.push(row);
      return acc;
    }, {});

    for (const key in groupedByProduct) {
      try {
        const item = groupedByProduct[key];
        const productRow = item.info;

        // 1. Find or Validate Category/Brand
        const category = await this.prisma.category.findFirst({
          where: { name: productRow.categoryName },
        });
        const brand = await this.prisma.brand.findFirst({
          where: { name: productRow.brandName },
        });

        if (!category || !brand) {
          throw new Error(
            `Category (${productRow.categoryName}) hoặc Brand (${productRow.brandName}) không tồn tại`,
          );
        }

        // 2. Upsert Product
        const product = await this.prisma.product.upsert({
          where: productRow.productId
            ? { id: productRow.productId }
            : { slug: productRow.productSlug },
          update: {
            name: productRow.productName,
            categoryId: category.id,
            brandId: brand.id,
          },
          create: {
            name: productRow.productName,
            slug:
              productRow.productSlug ||
              `${productRow.productName.toLowerCase().replace(/ /g, '-')}-${Date.now()}`,
            categoryId: category.id,
            brandId: brand.id,
          },
        });

        // 3. Upsert SKUs
        for (const skuRow of item.skus) {
          await this.prisma.sku.upsert({
            where: skuRow.skuId
              ? { id: skuRow.skuId }
              : { skuCode: skuRow.skuCode },
            update: {
              price: skuRow.price,
              salePrice: skuRow.salePrice,
              stock: skuRow.stock,
              status: skuRow.status,
            },
            create: {
              skuCode: skuRow.skuCode,
              price: skuRow.price,
              salePrice: skuRow.salePrice,
              stock: skuRow.stock,
              productId: product.id,
              status: skuRow.status,
            },
          });
          results.success++;
        }
      } catch (error) {
        this.logger.error(`Import error for product ${key}: ${error.message}`);
        results.failed += groupedByProduct[key].skus.length;
        results.errors.push({ key, error: error.message });
      }
    }

    return results;
  }
}
