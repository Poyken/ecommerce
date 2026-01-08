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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PRE-FETCH CACHING (Cơ chế nạp trước):
 * - Thay vì mỗi dòng trong Excel lại gọi DB để tìm Category/Brand, ta load TOÀN BỘ chúng vào RAM ngay từ đầu (`categoryMap`, `brandMap`).
 * - Việc tìm kiếm trong RAM (Map) nhanh hơn gấp hàng ngàn lần so với gọi DB liên tục (N+1 Query Problem).
 *
 * 2. GROUPING BY PRODUCT:
 * - Trong Excel, 1 sản phẩm có thể có nhiều SKU (nhiều dòng).
 * - Ta group các dòng này lại theo `productId` hoặc `slug` để chỉ thực hiện `upsert` sản phẩm 1 lần duy nhất, sau đó mới xử lý các SKU bên dưới.
 *
 * 3. UPSERT (Update or Insert):
 * - Dùng `upsert` giúp code ngắn gọn: Nếu sản phẩm đã tồn tại -> Cập nhật thông tin; Nếu chưa có -> Tạo mới.
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
        const product = await this.prisma.product.upsert({
          where: (productRow.productId
            ? { id: productRow.productId }
            : { slug: productRow.productSlug }) as any,
          update: {
            name: productRow.productName,
            categoryId,
            brandId,
          },
          create: {
            name: productRow.productName,
            slug:
              productRow.productSlug ||
              `${productRow.productName.toLowerCase().replace(/ /g, '-')}-${Date.now()}`,
            categoryId,
            brandId,
            tenantId: getTenant()!.id,
          },
        });

        // 3. Upsert SKUs
        for (const skuRow of item.skus) {
          await this.prisma.sku.upsert({
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
            },
            create: {
              skuCode: skuRow.skuCode,
              price: skuRow.price,
              salePrice: skuRow.salePrice,
              stock: skuRow.stock,
              productId: product.id,
              tenantId: product.tenantId,
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
