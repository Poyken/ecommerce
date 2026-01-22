/**
 * =====================================================================
 * PROMOTIONS SERVICE - HỆ THỐNG KHUYẾN MÃI (MARKETING ENGINE)
 * =====================================================================
 *
 * =====================================================================
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@core/prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import {
  ValidatePromotionDto,
  ApplyPromotionDto,
} from './dto/validate-promotion.dto';
import {
  PromotionRuleType,
  PromotionActionType,
  RuleOperator,
} from './dto/create-promotion.dto';
import { getTenant } from '@core/tenant/tenant.context';
import { Prisma } from '@prisma/client';

// Re-export enums for external use
export { PromotionRuleType, PromotionActionType, RuleOperator };

export interface ValidationResult {
  valid: boolean;
  promotionId: string;
  promotionName: string;
  discountAmount: number;
  freeShipping: boolean;
  giftSkuIds: string[];
  message?: string;
}

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(private prisma: PrismaService) {}

  private getTenantId(): string {
    const tenant = getTenant();
    if (!tenant?.id)
      throw new BadRequestException(
        'Không xác định được Cửa hàng (Tenant context missing)',
      );
    return tenant.id;
  }

  /**
   * Tạo chương trình khuyến mãi mới
   */
  async create(dto: CreatePromotionDto) {
    const tenantId = this.getTenantId();
    const { rules, actions, ...data } = dto;

    // Kiểm tra code trùng trong tenant
    if (data.code) {
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

  /**
   * Lấy danh sách tất cả chương trình khuyến mãi
   */
  async findAll(options?: {
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const tenantId = this.getTenantId();
    const { isActive, search, page = 1, limit = 20 } = options || {};

    const where: Prisma.PromotionWhereInput = {
      tenantId,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        include: {
          rules: true,
          actions: true,
          _count: { select: { usages: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.promotion.count({ where }),
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

  /**
   * Lấy chi tiết một chương trình khuyến mãi
   */
  async findOne(id: string) {
    const tenantId = this.getTenantId();
    const promo = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        rules: true,
        actions: true,
        usages: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!promo || promo.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }
    return promo;
  }

  /**
   * Cập nhật chương trình khuyến mãi
   */
  async update(id: string, dto: UpdatePromotionDto) {
    const tenantId = this.getTenantId();
    const existing = await this.prisma.promotion.findUnique({ where: { id } });

    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }

    const { rules, actions, ...data } = dto;

    // Update trong transaction
    return this.prisma.$transaction(async (tx) => {
      // Xóa rules/actions cũ nếu có cập nhật
      if (rules) {
        await tx.promotionRule.deleteMany({ where: { promotionId: id } });
      }
      if (actions) {
        await tx.promotionAction.deleteMany({ where: { promotionId: id } });
      }

      return tx.promotion.update({
        where: { id },
        data: {
          ...data,
          ...(rules && {
            rules: {
              create: rules.map((r) => ({ ...r, tenantId })),
            },
          }),
          ...(actions && {
            actions: {
              create: actions.map((a) => ({ ...a, tenantId })),
            },
          }),
        },
        include: { rules: true, actions: true },
      });
    });
  }

  /**
   * Xóa chương trình khuyến mãi
   */
  async remove(id: string) {
    const tenantId = this.getTenantId();
    const existing = await this.prisma.promotion.findUnique({ where: { id } });

    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }

    // Check nếu đã có usage thì không cho xóa
    const usageCount = await this.prisma.promotionUsage.count({
      where: { promotionId: id },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        `Không thể xóa vì đã có ${usageCount} lượt sử dụng. Hãy vô hiệu hóa thay vì xóa.`,
      );
    }

    return this.prisma.promotion.delete({ where: { id } });
  }

  /**
   * Bật/Tắt chương trình khuyến mãi
   */
  async toggleActive(id: string) {
    const tenantId = this.getTenantId();
    const existing = await this.prisma.promotion.findUnique({ where: { id } });

    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }

    return this.prisma.promotion.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }

  /**
   * Validate promotion code against cart context
   * Logic phức tạp: Kiểm tra tất cả rules và tính discount
   */
  async validatePromotion(
    dto: ValidatePromotionDto,
  ): Promise<ValidationResult> {
    const tenantId = this.getTenantId();
    const { code, userId, customerGroupId, items } = dto;

    // FIND PROMOTION
    const promotion = await this.prisma.promotion.findUnique({
      where: { tenantId_code: { tenantId, code } },
      include: { rules: true, actions: true },
    });

    if (!promotion) {
      throw new NotFoundException('Mã khuyến mãi không tồn tại');
    }

    if (!promotion.isActive) {
      throw new BadRequestException('Mã khuyến mãi đang tạm ngưng');
    }

    // [ZERO TRUST SECURITY]: NEVER trust prices or totalAmount from DTO.
    // ALWAYS fetch from DB to prevent rule-triggering exploits.
    if (!items || items.length === 0) {
      throw new BadRequestException(
        'Danh sách sản phẩm không được trống khi kiểm tra mã',
      );
    }

    // [P11 FIX]: Fetch SKUs from DB to get reliable prices
    const skuIds = items.map((i) => i.skuId);
    const dbSkus = await this.prisma.sku.findMany({
      where: { id: { in: skuIds }, tenantId },
      select: { id: true, price: true, productId: true, product: { select: { categories: { select: { categoryId: true } } } } },
    });
    const skuMap = new Map(dbSkus.map((s) => [s.id, s]));

    let calculatedTotal = new Prisma.Decimal(0);
    const enrichedItems = items.map(item => {
      const sku = skuMap.get(item.skuId);
      if (!sku) {
        throw new BadRequestException(`Sản phẩm ${item.skuId} không tồn tại hoặc không thuộc cửa hàng này`);
      }
      const price = sku.price || new Prisma.Decimal(0);
      calculatedTotal = calculatedTotal.add(price.mul(item.quantity));
      
      return {
        ...item,
        price: price.toNumber(), // Keep as number for internal context for now, but use Decimal for sum
        productId: sku.productId,
        categoryId: sku.product.categories[0]?.categoryId, // Assuming first category for rule evaluation
      };
    });

    const effectiveTotal = calculatedTotal;

    // Kiểm tra thời gian
    const now = new Date();
    if (now < promotion.startDate) {
      throw new BadRequestException(
        `Mã khuyến mãi chưa có hiệu lực. Bắt đầu từ ${promotion.startDate.toLocaleDateString('vi-VN')}`,
      );
    }
    if (now > promotion.endDate) {
      throw new BadRequestException('Mã khuyến mãi đã hết hạn');
    }

    // Kiểm tra giới hạn sử dụng tổng
    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      throw new BadRequestException('Mã khuyến mãi đã hết lượt sử dụng');
    }

    // Kiểm tra user đã sử dụng chưa (nếu có userId)
    if (userId) {
      const userUsage = await this.prisma.promotionUsage.findFirst({
        where: { promotionId: promotion.id, userId },
      });
      if (userUsage) {
        throw new BadRequestException('Bạn đã sử dụng mã khuyến mãi này rồi');
      }
    }

    // Evaluate tất cả rules
    for (const rule of promotion.rules) {
      const passed = await this.evaluateRule(rule, {
        totalAmount: effectiveTotal.toNumber(),
        userId,
        customerGroupId,
        items: enrichedItems,
        tenantId,
      });

      if (!passed) {
        throw new BadRequestException(
          `Điều kiện không thỏa mãn: ${this.getRuleMessage(rule)}`,
        );
      }
    }

    // Calculate discount từ actions
    const result = this.calculateActions(
      promotion.actions,
      effectiveTotal.toNumber(),
      enrichedItems,
    );

    return {
      valid: true,
      promotionId: promotion.id,
      promotionName: promotion.name,
      ...result,
    };
  }

  /**
   * Apply promotion vào đơn hàng (ghi nhận usage)
   */
  async applyPromotion(dto: ApplyPromotionDto) {
    const tenantId = this.getTenantId();
    const { code, orderId, userId, totalAmount, items, customerGroupId } = dto;

    // Validate trước
    const validation = await this.validatePromotion({
      code,
      totalAmount,
      userId,
      items,
      customerGroupId,
    });

    // Transaction: Tăng usedCount và tạo usage record
    return this.prisma.$transaction(async (tx) => {
      // Atomic increment usedCount
      await tx.promotion.update({
        where: { id: validation.promotionId },
        data: { usedCount: { increment: 1 } },
      });

      // Tạo usage record
      const usage = await tx.promotionUsage.create({
        data: {
          promotionId: validation.promotionId,
          userId: userId!,
          orderId,
          discountAmount: validation.discountAmount,
          tenantId,
        },
      });

      return {
        ...validation,
        usageId: usage.id,
      };
    });
  }

  /**
   * Lấy các promotions đang active và khả dụng
   */
  async getAvailablePromotions(context?: {
    totalAmount?: number;
    userId?: string;
  }) {
    const tenantId = this.getTenantId();
    const now = new Date();

    // SQL-based filtering for basic availability constraints
    const promotions = await this.prisma.promotion.findMany({
      where: {
        tenantId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        OR: [{ usageLimit: null }, { usageLimit: { gt: this.prisma.promotion.fields.usedCount } }],
      },
      include: { rules: true, actions: true },
      orderBy: { priority: 'desc' },
    });

    // Nếu có context, filter thêm những cái applicable
    if (context?.totalAmount) {
      return promotions.filter((promo) => {
        // Simple filter: check MIN_ORDER_VALUE rules
        const minOrderRule = promo.rules.find(
          (r) => r.type === PromotionRuleType.MIN_ORDER_VALUE,
        );
        if (minOrderRule) {
          const minAmount = parseFloat(minOrderRule.value);
          if (context.totalAmount! < minAmount) return false;
        }
        return true;
      });
    }

    return promotions;
  }

  /**
   * Thống kê sử dụng promotion
   */
  async getPromotionStats(promotionId: string) {
    const tenantId = this.getTenantId();
    const promotion = await this.findOne(promotionId);

    const usages = await this.prisma.promotionUsage.findMany({
      where: { promotionId, tenantId },
      include: { order: { select: { totalAmount: true } } },
    });

    const totalDiscount = usages.reduce(
      (sum, u) => sum + Number(u.discountAmount),
      0,
    );
    const totalOrderAmount = usages.reduce(
      (sum, u) => sum + Number(u.order.totalAmount),
      0,
    );

    return {
      promotion,
      stats: {
        totalUsages: usages.length,
        totalDiscount,
        totalOrderAmount,
        remainingUsages: promotion.usageLimit
          ? promotion.usageLimit - promotion.usedCount
          : 'Không giới hạn',
        averageDiscount: usages.length > 0 ? totalDiscount / usages.length : 0,
      },
    };
  }
  /**
   * Tặng quà chào mừng thành viên mới
   */
  async grantWelcomeVoucher(userId: string) {
    const tenantId = this.getTenantId();

    // Kiểm tra user đã nhận quà chưa (chống spam nhận quà)
    const existingNotification = await (this.prisma.notification as any).findFirst({
      where: {
        userId,
        tenantId,
        title: { contains: 'Quà tặng chào mừng' },
      },
    });

    if (existingNotification) {
      this.logger.log(`User ${userId} đã nhận quà chào mừng rồi, bỏ qua...`);
      return null;
    }

    // [TODO]: Thực tế sẽ tạo một mã Promotion hoặc áp dụng một Rule đặc biệt.
    // Hiện tại chúng ta chỉ tạo Notification để thông báo, logic Promo Engine sẽ tự hiểu
    // thông qua Rule FIRST_ORDER khi user checkout.

    this.logger.log(`Ghi nhận quà chào mừng cho User ${userId}`);

    return {
      userId,
      type: 'WELCOME_GIFT',
      title: 'Quà tặng chào mừng thành viên mới! 🎁',
      message: `Chào mừng bạn! Bạn sẽ nhận được ưu đãi giảm giá cho đơn hàng đầu tiên.`,
    };
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  /**
   * Evaluate một rule cụ thể
   */
  private async evaluateRule(
    rule: { type: string; operator: string; value: string },
    context: {
      totalAmount: number;
      userId?: string;
      customerGroupId?: string;
      items?: Array<{
        skuId: string;
        quantity: number;
        price: number;
        categoryId?: string;
        productId?: string;
      }>;
      tenantId: string;
    },
  ): Promise<boolean> {
    const { type, operator, value } = rule;

    switch (type) {
      case PromotionRuleType.MIN_ORDER_VALUE:
        return this.compareDecimals(
          new Prisma.Decimal(context.totalAmount),
          operator,
          new Prisma.Decimal(value),
        );

      case PromotionRuleType.MIN_QUANTITY:
        const totalQty =
          context.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
        return this.compareNumbers(totalQty, operator, parseInt(value));

      case PromotionRuleType.SPECIFIC_CATEGORY:
        try {
          const categoryIds = JSON.parse(value) as string[];
          if (!context.items) return false;
          return context.items.some(
            (item) => item.categoryId && categoryIds.includes(item.categoryId),
          );
        } catch (e) {
          this.logger.error(`Invalid JSON in promotion rule value: ${value}`);
          return false;
        }

      case PromotionRuleType.SPECIFIC_PRODUCT:
        try {
          const productIds = JSON.parse(value) as string[];
          if (!context.items) return false;
          return context.items.some(
            (item) => item.productId && productIds.includes(item.productId),
          );
        } catch (e) {
          return false;
        }

      case PromotionRuleType.CUSTOMER_GROUP:
        try {
          const groupIds = JSON.parse(value) as string[];
          return context.customerGroupId
            ? groupIds.includes(context.customerGroupId)
            : false;
        } catch (e) {
          return false;
        }

      case PromotionRuleType.FIRST_ORDER:
        if (!context.userId) return false;
        const orderCount = await this.prisma.order.count({
          where: {
            userId: context.userId,
            tenantId: context.tenantId,
            status: { not: 'CANCELLED' },
          },
        });
        return orderCount === 0;

      default:
        this.logger.warn(`Unknown rule type: ${type}`);
        return true;
    }
  }

  private compareDecimals(
    a: Prisma.Decimal,
    operator: string,
    b: Prisma.Decimal,
  ): boolean {
    switch (operator) {
      case RuleOperator.EQ:
        return a.equals(b);
      case RuleOperator.GTE:
        return a.gte(b);
      case RuleOperator.LTE:
        return a.lte(b);
      case RuleOperator.GT:
        return a.gt(b);
      case RuleOperator.LT:
        return a.lt(b);
      default:
        return false;
    }
  }

  private compareNumbers(a: number, operator: string, b: number): boolean {
    switch (operator) {
      case RuleOperator.EQ:
        return a === b;
      case RuleOperator.GTE:
        return a >= b;
      case RuleOperator.LTE:
        return a <= b;
      case RuleOperator.GT:
        return a > b;
      case RuleOperator.LT:
        return a < b;
      default:
        return false;
    }
  }

  private calculateActions(
    actions: Array<{
      type: string;
      value: string;
      maxDiscountAmount: Prisma.Decimal | null;
    }>,
    totalAmount: number,
    items?: Array<{ skuId: string; quantity: number; price: number }>,
  ): { discountAmount: number; freeShipping: boolean; giftSkuIds: string[] } {
    let discountAmount = new Prisma.Decimal(0);
    let freeShipping = false;
    const giftSkuIds: string[] = [];
    const totalDec = new Prisma.Decimal(totalAmount);

    for (const action of actions) {
      const val = new Prisma.Decimal(action.value);

      switch (action.type) {
        case PromotionActionType.DISCOUNT_FIXED:
          discountAmount = discountAmount.add(val);
          break;

        case PromotionActionType.DISCOUNT_PERCENT:
          let percentDiscount = totalDec.mul(val).div(100);

          if (action.maxDiscountAmount) {
            const maxDec = new Prisma.Decimal(action.maxDiscountAmount);
            if (percentDiscount.gt(maxDec)) {
              percentDiscount = maxDec;
            }
          }
          discountAmount = discountAmount.add(percentDiscount);
          break;

        case PromotionActionType.FREE_SHIPPING:
          freeShipping = true;
          break;

        case PromotionActionType.GIFT:
          giftSkuIds.push(action.value);
          break;

        case PromotionActionType.BUY_X_GET_Y:
          try {
            const buyXGetY = JSON.parse(action.value);
            // Buy X Get Y logic would go here
          } catch {
            this.logger.warn('Invalid BUY_X_GET_Y config');
          }
          break;
      }
    }

    // Ensure discount does not exceed total
    if (discountAmount.gt(totalDec)) {
      discountAmount = totalDec;
    }

    return {
      discountAmount: discountAmount.toNumber(),
      freeShipping,
      giftSkuIds,
    };
  }

  /**
   * Lấy message mô tả rule cho user
   */
  private getRuleMessage(rule: {
    type: string;
    operator: string;
    value: string;
  }): string {
    switch (rule.type) {
      case PromotionRuleType.MIN_ORDER_VALUE:
        return `Đơn hàng tối thiểu ${parseInt(rule.value).toLocaleString('vi-VN')}đ`;
      case PromotionRuleType.MIN_QUANTITY:
        return `Số lượng sản phẩm tối thiểu ${rule.value}`;
      case PromotionRuleType.SPECIFIC_CATEGORY:
        return 'Chỉ áp dụng cho danh mục cụ thể';
      case PromotionRuleType.SPECIFIC_PRODUCT:
        return 'Chỉ áp dụng cho sản phẩm cụ thể';
      case PromotionRuleType.CUSTOMER_GROUP:
        return 'Chỉ áp dụng cho nhóm khách hàng cụ thể';
      case PromotionRuleType.FIRST_ORDER:
        return 'Chỉ áp dụng cho đơn hàng đầu tiên';
      default:
        return rule.type;
    }
  }
}
