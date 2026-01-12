import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@core/prisma/prisma.service';

/**
 * =====================================================================
 * INVOICE SERVICE - Tạo hóa đơn cho đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. INVOICE DATA:
 * - Tổng hợp thông tin đơn hàng: Khách hàng, Sản phẩm, Giá, Thuế.
 * - Trả về dữ liệu JSON để frontend render hoặc tạo PDF.
 *
 * 2. INVOICE NUMBER:
 * - Tự động sinh mã hóa đơn dạng INV-YYYYMMDD-XXXXX. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  order: {
    id: string;
    createdAt: string;
    status: string;
  };
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items: {
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async generateInvoiceData(orderId: string): Promise<InvoiceData> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        // coupon: true, // [MIGRATION] Coupon relation removed
        items: {
          include: {
            sku: {
              include: {
                product: true,
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
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const items = order.items.map((item) => {
      const variantName = item.sku.optionValues
        .map((ov) => `${ov.optionValue.option.name}: ${ov.optionValue.value}`)
        .join(', ');
      const productName = item.sku.product.name;

      return {
        name: variantName ? `${productName} (${variantName})` : productName,
        sku: item.sku.skuCode,
        quantity: item.quantity,
        unitPrice: Number(item.priceAtPurchase),
        total: item.quantity * Number(item.priceAtPurchase),
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = 0; // VAT can be added later
    const shipping = Number(order.shippingFee || 0);

    // Calculate discount from coupon
    let discount = 0;
    // [MIGRATION TODO]: Use PromotionUsage relation instead of coupon relation
    // if (order.coupon) {
    //   if (order.coupon.discountType === 'PERCENTAGE') {
    //     discount = subtotal * (Number(order.coupon.discountValue) / 100);
    //     // Apply max discount limit if specified
    //     if (order.coupon.maxDiscountAmount) {
    //       discount = Math.min(discount, Number(order.coupon.maxDiscountAmount));
    //     }
    //   } else if (order.coupon.discountType === 'FIXED_AMOUNT') {
    //     discount = Number(order.coupon.discountValue);
    //   }
    // }

    const total = Number(order.totalAmount);

    // Generate invoice number
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const invoiceNumber = `INV-${dateStr}-${randomPart}`;

    return {
      invoiceNumber,
      issueDate: date.toISOString().split('T')[0],
      dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      order: {
        id: order.id,
        createdAt: order.createdAt.toISOString(),
        status: order.status,
      },
      customer: {
        name: order.recipientName,
        email: order.user?.email || '',
        phone: order.phoneNumber,
        address: order.shippingAddress || undefined,
      },
      items,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      company: {
        name: this.configService.get('COMPANY_NAME') || 'E-Commerce Store',
        address:
          this.configService.get('COMPANY_ADDRESS') ||
          '123 Business Street, City',
        phone: this.configService.get('COMPANY_PHONE') || '+84 123 456 789',
        email: this.configService.get('COMPANY_EMAIL') || 'contact@store.com',
      },
    };
  }
}
