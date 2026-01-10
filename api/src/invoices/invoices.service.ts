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
