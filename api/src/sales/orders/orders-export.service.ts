import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

@Injectable()
export class OrdersExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportToExcel(res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
      { header: 'Order ID', key: 'id', width: 40 },
      { header: 'Customer Email', key: 'email', width: 30 },
      { header: 'Order Date', key: 'createdAt', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Shipping Fee', key: 'shippingFee', width: 15 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
      { header: 'Recipient Name', key: 'recipientName', width: 20 },
      { header: 'Phone Number', key: 'phoneNumber', width: 15 },
      { header: 'Shipping Address', key: 'shippingAddress', width: 40 },
      { header: 'Items', key: 'items', width: 50 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const batchSize = 100;
    let cursor: string | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      const orders = await this.prisma.order.findMany({
        take: batchSize,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' },
        include: {
          user: true,
          items: {
            include: {
              sku: {
                include: { product: true },
              },
            },
          },
        },
      });

      if (orders.length === 0) {
        hasMore = false;
        break;
      }

      for (const order of orders) {
        const itemsSummary = order.items
          .map((i) => {
            const name = i.productName || i.sku?.product?.name || i.skuId;
            return `${name} (x${i.quantity})`;
          })
          .join(', ');

        worksheet.addRow({
          id: order.id,
          email: order.user?.email || 'N/A',
          createdAt: order.createdAt.toISOString().split('T')[0],
          status: order.status,
          totalAmount: Number(order.totalAmount),
          shippingFee: Number(order.shippingFee),
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          recipientName: order.recipientName,
          phoneNumber: order.phoneNumber,
          shippingAddress: order.shippingAddress,
          items: itemsSummary,
        });
      }

      cursor = orders[orders.length - 1].id;
      if (orders.length < batchSize) {
        hasMore = false;
      }
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `orders-export-${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
