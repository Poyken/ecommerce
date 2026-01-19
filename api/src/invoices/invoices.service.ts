/**
 * =====================================================================
 * INVOICES SERVICE - Xuất hóa đơn cho Tenant
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RELATIONAL DATA:
 * - `findAllSuperAdmin`: Khi lấy danh sách hóa đơn, cần `include` thêm
 *   thông tin `tenant` (để biết ai trả) và `subscriptionPlan` (trả cho gói nào).
 *
 * 2. MANUAL STATUS UPDATE:
 * - Trong trường hợp Tenant chuyển khoản ngân hàng (Bank Transfer) thay vì
 *   cổng thanh toán tự động, Admin cần nút bấm để "Duyệt" (Mark as Paid). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAllSuperAdmin(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // Fetch invoices with Tenant info
    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              domain: true,
              subdomain: true,
            },
          },
          subscription: {
            include: {
              subscriptionPlan: true,
            },
          },
        },
      }),
      this.prisma.invoice.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Feature: Mark as Paid manually (if bank transfer)
  async updateStatus(
    id: string,
    status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'VOID',
  ) {
    return this.prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }
}
