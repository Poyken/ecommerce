import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { SkuManagerService } from './sku-manager.service';

/**
 * =====================================================================
 * PRODUCTS IMPORT SERVICE - NHẬP DỮ LIỆU SẢN PHẨM TỪ EXCEL
 * =====================================================================
 *
 * =====================================================================
 */
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

      const getString = (val: ExcelJS.CellValue) => {
        if (val === null || val === undefined) return undefined;
        return typeof val === 'object' ? JSON.stringify(val) : String(val);
      };

      const rowData = {
        productId: getString(row.getCell(1).value),
        productName: getString(row.getCell(2).value),
        productSlug: getString(row.getCell(3).value),
        categoryName: getString(row.getCell(4).value),
        brandName: getString(row.getCell(5).value),
        skuId: getString(row.getCell(6).value),
        skuCode: getString(row.getCell(7).value),
        price: Number(row.getCell(8).value),
        salePrice: row.getCell(9).value ? Number(row.getCell(9).value) : null,
        stock: Number(row.getCell(10).value),
        status: getString(row.getCell(12).value) || 'ACTIVE',
      };
      rows.push(rowData);
    });

    const results = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [] as { key: string; error: any }[],
    };

    // [P15 OPTIMIZATION] Batch lookup caching - Prefetch all categories & brands
    const [allCategories, allBrands] = await Promise.all([
      this.prisma.category.findMany({ select: { id: true, name: true } }),
      this.prisma.brand.findMany({ select: { id: true, name: true } }),
    ]);

    const categoryMap = new Map(
      allCategories.map((c) => [c.name.toLowerCase(), c.id]),
    );
    const brandMap = new Map(
      allBrands.map((b) => [b.name.toLowerCase(), b.id]),
    );

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

        // 1. Find or Validate Category/Brand (Using Cache)
        const categoryId = categoryMap.get(
          (productRow.categoryName || '').toLowerCase(),
        );
        const brandId = brandMap.get(
          (productRow.brandName || '').toLowerCase(),
        );

        if (!categoryId || !brandId) {
          throw new Error(
            `Category (${productRow.categoryName}) hoặc Brand (${productRow.brandName}) không tồn tại`,
          );
        }

        // 2. Upsert Product
        const product = await (this.prisma.product as any).upsert({
          where: (productRow.productId
            ? { id: productRow.productId }
            : { slug: productRow.productSlug }) as any,
          update: {
            name: productRow.productName,
            brandId,
            categories: {
              deleteMany: {},
              create: [
                {
                  categoryId,
                  tenantId: getTenant()!.id,
                },
              ],
            },
          } as any,
          create: {
            name: productRow.productName,
            slug:
              productRow.productSlug ||
              `${productRow.productName.toLowerCase().replace(/ /g, '-')}-${Date.now()}`,
            brandId,
            tenantId: getTenant()!.id,
            categories: {
              create: [{ categoryId, tenantId: getTenant()!.id }],
            },
          } as any,
        });

        // 3. Upsert SKUs
        for (const skuRow of item.skus) {
          await (this.prisma.sku as any).upsert({
            where: (skuRow.skuId
              ? { id: skuRow.skuId }
              : {
                  tenantId_skuCode: {
                    skuCode: skuRow.skuCode as string,
                    tenantId: product.tenantId || '',
                  },
                }) as any,
            update: {
              price: skuRow.price,
              salePrice: skuRow.salePrice,
              stock: skuRow.stock,
              status: skuRow.status,
            } as any,
            create: {
              skuCode: skuRow.skuCode,
              price: skuRow.price,
              salePrice: skuRow.salePrice,
              stock: skuRow.stock,
              productId: product.id,
              tenantId: product.tenantId,
              status: skuRow.status,
            } as any,
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

  async previewFromExcel(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    const worksheet = workbook.getWorksheet(1);

    if (!worksheet) {
      throw new BadRequestException('File Excel không hợp lệ');
    }

    const previewData: any[] = [];
    const [allCategories, allBrands] = await Promise.all([
      this.prisma.category.findMany({ select: { id: true, name: true } }),
      this.prisma.brand.findMany({ select: { id: true, name: true } }),
    ]);

    const categoryNames = new Set(
      allCategories.map((c) => c.name.toLowerCase()),
    );
    const brandNames = new Set(allBrands.map((b) => b.name.toLowerCase()));

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const getString = (val: ExcelJS.CellValue) => {
        if (val === null || val === undefined) return '';
        return typeof val === 'object' ? JSON.stringify(val) : String(val);
      };

      const productRow = {
        productName: getString(row.getCell(2).value),
        productSlug: getString(row.getCell(3).value),
        categoryName: getString(row.getCell(4).value),
        brandName: getString(row.getCell(5).value),
        skuCode: getString(row.getCell(7).value),
        price: Number(row.getCell(8).value),
        stock: Number(row.getCell(10).value),
        status: getString(row.getCell(12).value) || 'ACTIVE',
      };

      const errors: string[] = [];
      if (!productRow.productName) errors.push('Thiếu tên sản phẩm');
      if (!productRow.skuCode) errors.push('Thiếu mã SKU');
      if (isNaN(productRow.price)) errors.push('Giá không hợp lệ');
      if (isNaN(productRow.stock)) errors.push('Số lượng không hợp lệ');

      if (
        productRow.categoryName &&
        !categoryNames.has(productRow.categoryName.toLowerCase())
      ) {
        errors.push(`Danh mục "${productRow.categoryName}" không tồn tại`);
      }
      if (
        productRow.brandName &&
        !brandNames.has(productRow.brandName.toLowerCase())
      ) {
        errors.push(`Thương hiệu "${productRow.brandName}" không tồn tại`);
      }

      previewData.push({
        ...productRow,
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
      {
        header: 'Product ID (Leave Empty for New)',
        key: 'productId',
        width: 30,
      },
      { header: 'Product Name (*)', key: 'productName', width: 30 },
      { header: 'Product Slug (Optional)', key: 'productSlug', width: 30 },
      { header: 'Category Name (*)', key: 'categoryName', width: 20 },
      { header: 'Brand Name (*)', key: 'brandName', width: 20 },
      { header: 'SKU ID (Leave Empty for New)', key: 'skuId', width: 30 },
      { header: 'SKU Code (*)', key: 'skuCode', width: 20 },
      { header: 'Price (*)', key: 'price', width: 15 },
      { header: 'Sale Price', key: 'salePrice', width: 15 },
      { header: 'Stock (*)', key: 'stock', width: 10 },
      { header: 'Attributes (Ignored)', key: 'attributes', width: 30 },
      { header: 'Status (ACTIVE/INACTIVE)', key: 'status', width: 20 },
    ];

    // Add example row
    worksheet.addRow({
      productName: 'Example iPhone 15',
      categoryName: 'Smartphones',
      brandName: 'Apple',
      skuCode: 'IPHONE-15-RED',
      price: 20000000,
      stock: 100,
      status: 'ACTIVE',
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=product_import_template.xlsx',
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
