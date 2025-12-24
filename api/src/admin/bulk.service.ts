import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * =====================================================================
 * BULK SERVICE - Xử lý thao tác hàng loạt (Import/Export)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. EXPORT:
 * - Xuất danh sách sản phẩm/SKU ra định dạng CSV/JSON để tải về.
 *
 * 2. IMPORT:
 * - Nhập dữ liệu từ file CSV/JSON và cập nhật vào database.
 * - Có cơ chế validate và báo lỗi từng dòng nếu không hợp lệ.
 *
 * 3. BULK UPDATE:
 * - Cập nhật giá/tồn kho hàng loạt theo phần trăm hoặc số cố định.
 * =====================================================================
 */

export interface ExportRow {
  skuCode: string;
  productName: string;
  variants: string;
  price: number;
  salePrice: number | null;
  stock: number;
  status: string;
}

export interface ImportRow {
  skuCode: string;
  price?: number;
  salePrice?: number;
  stock?: number;
  status?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
  changes?: {
    skuCode: string;
    status: string;
    diff?: any;
    error?: string;
    message?: string;
  }[];
}

export interface BulkUpdateDto {
  skuIds: string[];
  priceChange?: { type: 'fixed' | 'percentage'; value: number };
  stockChange?: { type: 'set' | 'add' | 'subtract'; value: number };
}

@Injectable()
export class BulkService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Xuất danh sách SKU ra CSV format
   */
  async exportSkus(): Promise<ExportRow[]> {
    const skus = await this.prisma.sku.findMany({
      include: {
        product: { select: { name: true } },
        optionValues: {
          include: {
            optionValue: {
              include: { option: true },
            },
          },
        },
      },
      orderBy: { skuCode: 'asc' },
    });

    return skus.map((sku) => ({
      skuCode: sku.skuCode,
      productName: sku.product.name,
      variants: sku.optionValues
        .map((ov) => `${ov.optionValue.option.name}: ${ov.optionValue.value}`)
        .join(' | '),
      price: Number(sku.price || 0),
      salePrice: sku.salePrice ? Number(sku.salePrice) : null,
      stock: sku.stock,
      status: sku.status,
    }));
  }

  /**
   * Chuyển data thành CSV string
   */
  async exportSkusToCsv(): Promise<string> {
    const data = await this.exportSkus();
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) =>
      Object.values(row)
        .map((v) =>
          typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : (v ?? ''),
        )
        .join(','),
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Import SKUs từ JSON data
   * @param rows Danh sách SKU cần update
   * @param dryRun Nếu true, chỉ kiểm tra và trả về kế hoạch thay đổi, không commit vào DB.
   */
  async importSkus(
    rows: ImportRow[],
    dryRun: boolean = false,
  ): Promise<ImportResult & { changes?: any[] }> {
    const result: ImportResult & { changes?: any[] } = {
      success: 0,
      failed: 0,
      errors: [],
      changes: [],
    };

    // Optimization: Fetch all SKUs first if list is small, or just loop.
    // Loop is safer for consistency if list is huge, but here we go row by row.

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.skuCode) {
          throw new Error('SKU code is required');
        }

        const existing = await this.prisma.sku.findUnique({
          where: { skuCode: row.skuCode },
        });

        if (!existing) {
          throw new Error(`SKU ${row.skuCode} not found`);
        }

        // Calculate changes
        const changes: any = { skuCode: row.skuCode, diff: {} };
        const updateData: any = {};
        let hasChange = false;

        if (
          row.price !== undefined &&
          Number(row.price) !== Number(existing.price)
        ) {
          updateData.price = row.price;
          changes.diff.price = { from: Number(existing.price), to: row.price };
          hasChange = true;
        }

        if (
          row.salePrice !== undefined &&
          Number(row.salePrice) !== Number(existing.salePrice)
        ) {
          updateData.salePrice = row.salePrice;
          changes.diff.salePrice = {
            from: Number(existing.salePrice),
            to: row.salePrice,
          };
          hasChange = true;
        }

        if (row.stock !== undefined && row.stock !== existing.stock) {
          updateData.stock = row.stock;
          changes.diff.stock = { from: existing.stock, to: row.stock };
          hasChange = true;
        }

        if (row.status !== undefined && row.status !== existing.status) {
          updateData.status = row.status;
          changes.diff.status = { from: existing.status, to: row.status };
          hasChange = true;
        }

        if (!hasChange) {
          // No change needed
          result.changes?.push({
            skuCode: row.skuCode,
            status: 'SKIPPED',
            message: 'No changes',
          });
          result.success++; // Considered success? Or neutral?
          continue;
        }

        if (!dryRun) {
          await this.prisma.sku.update({
            where: { skuCode: row.skuCode },
            data: updateData,
          });
          result.changes?.push({
            skuCode: row.skuCode,
            status: 'UPDATED',
            diff: changes.diff,
          });
        } else {
          result.changes?.push({
            skuCode: row.skuCode,
            status: 'PENDING',
            diff: changes.diff,
          });
        }

        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({ row: i + 1, message: error.message });
        result.changes?.push({
          skuCode: row?.skuCode || 'UNKNOWN',
          status: 'FAILED',
          error: error.message,
        });
      }
    }

    return result;
  }

  /**
   * Cập nhật giá/tồn kho hàng loạt
   */
  async bulkUpdate(dto: BulkUpdateDto): Promise<{ updated: number }> {
    const { skuIds, priceChange, stockChange } = dto;

    let updated = 0;

    for (const skuId of skuIds) {
      const sku = await this.prisma.sku.findUnique({ where: { id: skuId } });
      if (!sku) continue;

      const updateData: any = {};

      if (priceChange) {
        const currentPrice = Number(sku.price || 0);
        if (priceChange.type === 'fixed') {
          updateData.price = currentPrice + priceChange.value;
        } else {
          updateData.price = currentPrice * (1 + priceChange.value / 100);
        }
        updateData.price = Math.max(0, updateData.price);
      }

      if (stockChange) {
        if (stockChange.type === 'set') {
          updateData.stock = stockChange.value;
        } else if (stockChange.type === 'add') {
          updateData.stock = sku.stock + stockChange.value;
        } else if (stockChange.type === 'subtract') {
          updateData.stock = Math.max(0, sku.stock - stockChange.value);
        }
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.sku.update({
          where: { id: skuId },
          data: updateData,
        });
        updated++;
      }
    }

    return { updated };
  }
}
