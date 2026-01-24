/**
 * =====================================================================
 * PROMOTION AGGREGATE - Domain Layer
 * =====================================================================
 */

import { AggregateRoot, EntityProps } from '@core/domain/entities/base.entity';
import { BusinessRuleViolationError } from '@core/domain/errors/domain.error';

export enum PromotionRuleType {
  MIN_ORDER_VALUE = 'MIN_ORDER_VALUE',
  SPECIFIC_CATEGORY = 'SPECIFIC_CATEGORY',
  SPECIFIC_PRODUCT = 'SPECIFIC_PRODUCT',
  CUSTOMER_GROUP = 'CUSTOMER_GROUP',
  FIRST_ORDER = 'FIRST_ORDER',
  MIN_QUANTITY = 'MIN_QUANTITY',
}

export enum PromotionActionType {
  DISCOUNT_FIXED = 'DISCOUNT_FIXED',
  DISCOUNT_PERCENT = 'DISCOUNT_PERCENT',
  FREE_SHIPPING = 'FREE_SHIPPING',
  GIFT = 'GIFT',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
}

export enum RuleOperator {
  EQ = 'EQ',
  GT = 'GT',
  GTE = 'GTE',
  LT = 'LT',
  LTE = 'LTE',
  IN = 'IN',
}

export interface PromotionRuleProps {
  id: string;
  type: PromotionRuleType | string;
  operator: RuleOperator | string;
  value: string;
}

export interface PromotionActionProps {
  id: string;
  type: PromotionActionType | string;
  value: string;
  maxDiscountAmount?: number;
}

export interface PromotionProps extends EntityProps {
  tenantId: string;
  name: string;
  code?: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  priority: number;
  usageLimit?: number;
  usedCount: number;
  rules: PromotionRuleProps[];
  actions: PromotionActionProps[];
}

export interface PromotionContext {
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
  orderCount?: number; // Used for FIRST_ORDER check
}

export class Promotion extends AggregateRoot<PromotionProps> {
  private constructor(props: PromotionProps) {
    super(props);
  }

  static create(props: {
    id: string;
    tenantId: string;
    name: string;
    code?: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    isActive?: boolean;
    priority?: number;
    usageLimit?: number;
    usedCount?: number;
    rules: PromotionRuleProps[];
    actions: PromotionActionProps[];
    createdAt?: Date;
    updatedAt?: Date;
  }): Promotion {
    if (props.startDate >= props.endDate) {
      throw new BusinessRuleViolationError(
        'Start date must be before end date',
      );
    }

    return new Promotion({
      ...props,
      isActive: props.isActive ?? true,
      priority: props.priority ?? 0,
      usedCount: props.usedCount ?? 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static fromPersistence(props: PromotionProps): Promotion {
    return new Promotion(props);
  }

  get tenantId(): string {
    return this.props.tenantId;
  }
  get name(): string {
    return this.props.name;
  }
  get code(): string | undefined {
    return this.props.code;
  }
  get startDate(): Date {
    return this.props.startDate;
  }
  get endDate(): Date {
    return this.props.endDate;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get usedCount(): number {
    return this.props.usedCount;
  }
  get usageLimit(): number | undefined {
    return this.props.usageLimit;
  }
  get rules(): readonly PromotionRuleProps[] {
    return Object.freeze([...this.props.rules]);
  }
  get actions(): readonly PromotionActionProps[] {
    return Object.freeze([...this.props.actions]);
  }

  /**
   * Validate if the promotion is applicable in a given context
   */
  validate(context: PromotionContext): void {
    const now = new Date();

    if (!this.isActive) {
      throw new BusinessRuleViolationError('Mã khuyến mãi đang tạm ngưng');
    }

    if (now < this.startDate) {
      throw new BusinessRuleViolationError(
        `Mã khuyến mãi chưa có hiệu lực. Bắt đầu từ ${this.startDate.toLocaleDateString('vi-VN')}`,
      );
    }

    if (now > this.endDate) {
      throw new BusinessRuleViolationError('Mã khuyến mãi đã hết hạn');
    }

    if (this.usageLimit !== undefined && this.usedCount >= this.usageLimit) {
      throw new BusinessRuleViolationError('Mã khuyến mãi đã hết lượt sử dụng');
    }

    // Evaluate rules
    for (const rule of this.props.rules) {
      if (!this.evaluateRule(rule, context)) {
        throw new BusinessRuleViolationError(
          `Điều kiện không thỏa mãn: ${this.getRuleMessage(rule)}`,
        );
      }
    }
  }

  /**
   * Calculate discount and other benefits
   */
  calculateBenefits(context: PromotionContext): {
    discountAmount: number;
    freeShipping: boolean;
    giftSkuIds: string[];
  } {
    let discountAmount = 0;
    let freeShipping = false;
    const giftSkuIds: string[] = [];

    for (const action of this.props.actions) {
      const val = parseFloat(action.value);

      switch (action.type) {
        case PromotionActionType.DISCOUNT_FIXED:
          discountAmount += val;
          break;

        case PromotionActionType.DISCOUNT_PERCENT:
          let percentDiscount = (context.totalAmount * val) / 100;
          if (
            action.maxDiscountAmount &&
            percentDiscount > action.maxDiscountAmount
          ) {
            percentDiscount = action.maxDiscountAmount;
          }
          discountAmount += percentDiscount;
          break;

        case PromotionActionType.FREE_SHIPPING:
          freeShipping = true;
          break;

        case PromotionActionType.GIFT:
          giftSkuIds.push(action.value);
          break;

        // BUY_X_GET_Y logic could be added here
      }
    }

    // Ensure discount doesn't exceed total
    discountAmount = Math.min(discountAmount, context.totalAmount);

    return { discountAmount, freeShipping, giftSkuIds };
  }

  incrementUsage(): void {
    if (this.usageLimit !== undefined && this.usedCount >= this.usageLimit) {
      throw new BusinessRuleViolationError('Usage limit reached');
    }
    this.props.usedCount += 1;
    this.touch();
  }

  private evaluateRule(
    rule: PromotionRuleProps,
    context: PromotionContext,
  ): boolean {
    const { type, operator, value } = rule;

    switch (type) {
      case PromotionRuleType.MIN_ORDER_VALUE:
        return this.compareNumbers(
          context.totalAmount,
          operator,
          parseFloat(value),
        );

      case PromotionRuleType.MIN_QUANTITY:
        const totalQty =
          context.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
        return this.compareNumbers(totalQty, operator, parseInt(value));

      case PromotionRuleType.SPECIFIC_CATEGORY:
        try {
          const categoryIds = JSON.parse(value) as string[];
          return (
            context.items?.some(
              (i) => i.categoryId && categoryIds.includes(i.categoryId),
            ) ?? false
          );
        } catch {
          return false;
        }

      case PromotionRuleType.SPECIFIC_PRODUCT:
        try {
          const productIds = JSON.parse(value) as string[];
          return (
            context.items?.some(
              (i) => i.productId && productIds.includes(i.productId),
            ) ?? false
          );
        } catch {
          return false;
        }

      case PromotionRuleType.CUSTOMER_GROUP:
        try {
          const groupIds = JSON.parse(value) as string[];
          return context.customerGroupId
            ? groupIds.includes(context.customerGroupId)
            : false;
        } catch {
          return false;
        }

      case PromotionRuleType.FIRST_ORDER:
        return context.orderCount === 0;

      default:
        return true;
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

  private getRuleMessage(rule: PromotionRuleProps): string {
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

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      name: this.name,
      code: this.code,
      description: this.props.description,
      startDate: this.startDate,
      endDate: this.endDate,
      isActive: this.isActive,
      priority: this.props.priority,
      usageLimit: this.usageLimit,
      usedCount: this.usedCount,
      rules: this.rules,
      actions: this.actions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
