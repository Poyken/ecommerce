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
    if (!tenant?.id) throw new BadRequestException('Tenant context missing');
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
      throw new BadRequestException('Promotion code already exists');
    }

    return this.prisma.promotion.create({
      data: {
        ...data,
        tenantId,
        rules: { create: rules },
        actions: { create: actions },
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
      throw new NotFoundException('Promotion not found');
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

    if (!promotion) throw new NotFoundException('Promotion not found');

    if (!promotion.isActive)
      throw new BadRequestException('Promotion is inactive');

    const now = new Date();
    if (now < promotion.startDate || now > promotion.endDate) {
      throw new BadRequestException('Promotion is expired or not yet active');
    }

    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      throw new BadRequestException('Promotion usage limit reached');
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
        throw new BadRequestException(`Condition failed: ${rule.type}`);
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
  }
}
