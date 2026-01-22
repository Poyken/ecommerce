/**
 * =====================================================================
 * TAX SERVICE - QUẢN LÝ THUẾ VÀ ĐỊNH MỨC THUẾ
 * =====================================================================
 *
 * =====================================================================
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { CreateTaxRateDto, UpdateTaxRateDto, ApplyTaxDto } from './dto/tax.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TaxService {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================================================
  // QUẢN LÝ DANH MỤC THUẾ (CRUD)
  // =====================================================================

  async createTaxRate(tenantId: string, dto: CreateTaxRateDto) {
    return this.prisma.taxRate.create({
      data: {
        name: dto.name,
        rate: dto.rate,
        isActive: dto.isActive ?? true,
        tenantId,
      },
    });
  }

  async getTaxRates(tenantId: string) {
    return this.prisma.taxRate.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveTaxRates(tenantId: string) {
    return this.prisma.taxRate.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getTaxRateById(tenantId: string, id: string) {
    const taxRate = await this.prisma.taxRate.findUnique({
      where: { id, tenantId },
    });

    if (!taxRate) {
      throw new NotFoundException('Không tìm thấy mức thuế này');
    }
    return taxRate;
  }

  async updateTaxRate(tenantId: string, id: string, dto: UpdateTaxRateDto) {
    await this.getTaxRateById(tenantId, id);

    return this.prisma.taxRate.update({
      where: { id },
      data: dto,
    });
  }

  async deleteTaxRate(tenantId: string, id: string) {
    await this.getTaxRateById(tenantId, id);

    return this.prisma.taxRate.delete({
      where: { id },
    });
  }

  // =====================================================================
  // LOGIC TÍNH THUẾ CHO ĐƠN HÀNG
  // =====================================================================

  async applyTaxToOrder(tenantId: string, dto: ApplyTaxDto) {
    const { orderId, taxRateId } = dto;

    // 1. Kiểm tra mức thuế có tồn tại và đang hoạt động không
    const taxRate = await this.prisma.taxRate.findUnique({
      where: { id: taxRateId, tenantId, isActive: true },
    });

    if (!taxRate) {
      throw new NotFoundException(
        'Không tìm thấy mức thuế (hoặc thuế đã bị ngưng áp dụng)',
      );
    }

    // 2. Kiểm tra đơn hàng có tồn tại không
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    // 3. Tính toán số tiền thuế (Sử dụng Decimal để chính xác tuyệt đối)
    const taxableAmount = order.totalAmount;
    const taxAmount = new Decimal(taxableAmount.toString())
      .mul(taxRate.rate)
      .div(100);

    // 4. Lưu chi tiết thuế vào đơn hàng (OrderTaxDetail)
    const taxDetail = await this.prisma.orderTaxDetail.create({
      data: {
        orderId,
        name: taxRate.name,
        rate: taxRate.rate,
        amount: taxAmount,
        tenantId,
      },
    });

    return taxDetail;
  }

  async getOrderTaxDetails(tenantId: string, orderId: string) {
    // Xác minh đơn hàng thuộc về đúng Tenant
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    return this.prisma.orderTaxDetail.findMany({
      where: { orderId },
    });
  }

  async removeOrderTaxDetail(tenantId: string, id: string) {
    const taxDetail = await this.prisma.orderTaxDetail.findUnique({
      where: { id },
      include: { order: { select: { tenantId: true } } },
    });

    if (!taxDetail || taxDetail.order?.tenantId !== tenantId) {
      throw new NotFoundException(
        'Không tìm thấy chi tiết thuế của đơn hàng này',
      );
    }

    return this.prisma.orderTaxDetail.delete({
      where: { id },
    });
  }
}
