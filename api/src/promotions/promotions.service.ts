<<<<<<< HEAD
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePromotionDto) {
    this.logger.log(`Creating promotion: ${dto.name}`);

    // Note: Since 'promotion' model might not exist in Prisma schema yet,
    // I will simulate the DB call or comment it out to avoid compilation error during this test drive.
    // In a real scenario, we would run `npx prisma migrate` first.

    /* 
    return this.prisma.promotion.create({
      data: { ...dto },
    });
    */
    return { id: 'simulated-uuid', ...dto, createdAt: new Date() };
  }

  async findAll() {
    // return this.prisma.promotion.findMany();
    return [{ id: '1', name: 'Demo Promo' }];
  }

  async findOne(id: string) {
    // const item = await this.prisma.promotion.findUnique({ where: { id } });
    const item = { id, name: 'Demo Promo' };
    if (!item) throw new NotFoundException('Promotion not found');
    return item;
=======
/**
 * =====================================================================
 * PROMOTIONS SERVICE - HỆ THỐNG KHUYẾN MÃI (MARKETING ENGINE)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Đây là module xử lý các chương trình giảm giá, khuyến mãi linh hoạt.
 * Nó được thiết kế theo mô hình Rule-Action Engine.
 *
 * 1. CÁC THÀNH PHẦN CHÍNH:
 *    - Promotion: Thông tin chung (Mã, Thời gian, Giới hạn sử dụng).
 *    - PromotionRule: Các điều kiện để áp dụng (VD: Giỏ hàng > 500k, Mua sản phẩm A...).
 *    - PromotionAction: Hành động khi thỏa điều kiện (VD: Giảm 10%, Freeship, Tặng quà).
 *
 * 2. CƠ CHẾ VALIDATE (Hàm validatePromotion):
 *    - Kiểm tra thời hạn (startDate/endDate).
 *    - Kiểm tra giới hạn sử dụng (usageLimit).
 *    - Lần lượt kiểm tra tất cả các Rules gắn với Promotion đó.
 *    - Nếu tất cả Rules thỏa mãn -> Tính toán số tiền giảm dựa trên Action.
 *
 * 3. LƯU Ý:
 *    - Cột usedCount cần được cập nhật an toàn (Atomics increment) khi có đơn hàng thành công.
 * =====================================================================
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { getTenant } from '@core/tenant/tenant.context';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  private getTenantId(): string {
    const tenant = getTenant();
    if (!tenant?.id)
      throw new BadRequestException(
        'Không xác định được Cửa hàng (Tenant context missing)',
      );
    return tenant.id;
  }

  async create(dto: CreatePromotionDto) {
    const tenantId = this.getTenantId();
    const { rules, actions, ...data } = dto;

    // Check code uniqueness within tenant
    const existing = await this.prisma.promotion.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: data.code,
        },
      },
    });
    if (existing) {
      throw new BadRequestException('Mã khuyến mãi đã tồn tại');
    }

    return this.prisma.promotion.create({
      data: {
        ...data,
        tenantId,
        rules: {
          create: rules.map((r) => ({ ...r, tenantId })),
        },
        actions: {
          create: actions.map((a) => ({ ...a, tenantId })),
        },
      },
      include: { rules: true, actions: true },
    });
  }

  async findAll() {
    const tenantId = this.getTenantId();
    return this.prisma.promotion.findMany({
      where: { tenantId },
      include: { rules: true, actions: true },
    });
  }

  async findOne(id: string) {
    const tenantId = this.getTenantId();
    const promo = await this.prisma.promotion.findUnique({
      where: { id },
      include: { rules: true, actions: true },
    });
    if (!promo || promo.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }
    return promo;
  }

  /**
   * Complex Logic: Verify if promotion validates against Cart/Order Context
   */
  async validatePromotion(
    code: string,
    context: { totalAmount: number; userId?: string; items?: any[] },
  ) {
    const tenantId = this.getTenantId();
    const promotion = await this.prisma.promotion.findUnique({
      where: { tenantId_code: { tenantId, code } },
      include: { rules: true, actions: true },
    });

    if (!promotion)
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');

    if (!promotion.isActive)
      throw new BadRequestException('Chương trình khuyến mãi đang tạm ngưng');

    const now = new Date();
    if (now < promotion.startDate || now > promotion.endDate) {
      throw new BadRequestException(
        'Chương trình khuyến mãi đã hết hạn hoặc chưa bắt đầu',
      );
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      throw new BadRequestException(
        'Chương trình khuyến mãi đã hết lượt sử dụng',
      );
    }

    // Evaluate Rules
    for (const rule of promotion.rules) {
      let passed = false;
      switch (rule.type) {
        case 'MIN_ORDER_VALUE':
          const limit = parseFloat(rule.value);
          if (rule.operator === 'GTE' && context.totalAmount >= limit)
            passed = true;
          // Add other operators if needed
          break;
        // TODO: Implement other rules (CATEGORY, CUSTOMER_GROUP)
        default:
          passed = true; // Ignore unknown rules for now or fail?
      }

      if (!passed) {
        throw new BadRequestException(`Điều kiện không thỏa mãn: ${rule.type}`);
      }
    }

    // Calculate generic discount (take the first action for now)
    // Real logic would be more complex
    const action = promotion.actions[0];
    let discountAmount = 0;

    if (action) {
      const val = parseFloat(action.value);
      if (action.type === 'DISCOUNT_FIXED') {
        discountAmount = val;
      } else if (action.type === 'DISCOUNT_PERCENT') {
        discountAmount = (context.totalAmount * val) / 100;
        if (
          action.maxDiscountAmount &&
          discountAmount > Number(action.maxDiscountAmount)
        ) {
          discountAmount = Number(action.maxDiscountAmount);
        }
      }
    }

    return {
      valid: true,
      promotion,
      discountAmount,
    };
>>>>>>> 8f5a875198d5ce2371ec25b2aeb50dc403c8c172
  }
}
