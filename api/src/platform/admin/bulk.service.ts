import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';

/**
 * =====================================================================
 * BULK SERVICE - Xử lý thao tác hàng loạt (Import/Export)
 * =====================================================================
 *
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
   * Xuất danh sách SKU ra Excel Buffer
   */
  async exportSkusToExcel(): Promise<Buffer> {
    const data = await this.exportSkus();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('SKUs');

    // Define columns
    sheet.columns = [
      { header: 'SKU Code', key: 'skuCode', width: 20 },
      { header: 'Product Name', key: 'productName', width: 40 },
      { header: 'Variants', key: 'variants', width: 30 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Sale Price', key: 'salePrice', width: 15 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // Add rows
    sheet.addRows(data);

    // Style header
    sheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as any; // ExcelJS Buffer type differs from Node Buffer
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

        const tenant = getTenant();
        const existing = await this.prisma.sku.findFirst({
          where: {
            skuCode: row.skuCode,
            tenantId: tenant?.id,
          },
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
            where: { id: existing.id },
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
   * Parse Excel buffer and import
   */
  async importSkusFromExcel(
    buffer: any,
    dryRun: boolean,
  ): Promise<ImportResult & { changes?: any[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet(1);
    const rows: ImportRow[] = [];

    if (!sheet) {
      throw new Error('Excel file must have at least one sheet');
    }

    // Assume header is row 1
    // Map headers: SKU Code -> skuCode, Price -> price, etc.
    const headerMap: Record<number, string> = {};
    const headerRow = sheet.getRow(1);

    headerRow.eachCell((cell, colNumber) => {
      const val = (
        cell.value
          ? typeof cell.value === 'string'
            ? cell.value
            : JSON.stringify(cell.value)
          : ''
      )
        .toLowerCase()
        .trim();
      if (val === 'sku code') headerMap[colNumber] = 'skuCode';
      else if (val === 'price') headerMap[colNumber] = 'price';
      else if (val === 'sale price') headerMap[colNumber] = 'salePrice';
      else if (val === 'stock') headerMap[colNumber] = 'stock';
      else if (val === 'status') headerMap[colNumber] = 'status';
    });

    if (!Object.values(headerMap).includes('skuCode')) {
      throw new Error('Missing "SKU Code" column in Excel');
    }

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const rowData: any = {};
      let hasData = false;

      row.eachCell((cell, colNumber) => {
        const key = headerMap[colNumber];
        if (key) {
          let value: any = cell.value;
          // Handle potential rich text or formula results if simpler
          if (key === 'price' || key === 'salePrice' || key === 'stock') {
            value = Number(value);
          }
          if (value !== null && value !== undefined && value !== '') {
            rowData[key] = value;
            hasData = true;
          }
        }
      });

      if (hasData && rowData.skuCode) {
        rows.push(rowData);
      }
    });

    return this.importSkus(rows, dryRun);
  }

  /**
   * Cập nhật giá/tồn kho hàng loạt
   */
  async bulkUpdate(dto: BulkUpdateDto): Promise<{ updated: number }> {
    const { skuIds, priceChange, stockChange } = dto;

    let updated = 0;

    const tenant = getTenant();
    for (const skuId of skuIds) {
      const sku = await this.prisma.sku.findFirst({
        where: {
          id: skuId,
          tenantId: tenant?.id,
        },
      });
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
          where: {
            id: skuId,
            tenantId: tenant?.id,
          }, // Prisma handles multi-field updates correctly
          data: updateData,
        });
        updated++;
      }
    }

    return { updated };
  }
}
