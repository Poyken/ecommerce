/**
 * PROMOTION TYPES
 * Synced with API DTOs in api/src/promotions/dto/create-promotion.dto.ts
 *
 * @see api/src/promotions/dto/create-promotion.dto.ts
 */

/**
 * Loại điều kiện áp dụng khuyến mãi
 */
export enum PromotionRuleType {
  /** Đơn hàng tối thiểu */
  MIN_ORDER_VALUE = "MIN_ORDER_VALUE",
  /** Số lượng sản phẩm tối thiểu */
  MIN_QUANTITY = "MIN_QUANTITY",
  /** Áp dụng cho danh mục cụ thể */
  SPECIFIC_CATEGORY = "SPECIFIC_CATEGORY",
  /** Áp dụng cho sản phẩm cụ thể */
  SPECIFIC_PRODUCT = "SPECIFIC_PRODUCT",
  /** Áp dụng cho nhóm khách hàng */
  CUSTOMER_GROUP = "CUSTOMER_GROUP",
  /** Chỉ áp dụng cho đơn hàng đầu tiên */
  FIRST_ORDER = "FIRST_ORDER",
}

/**
 * Toán tử so sánh cho rules
 */
export enum PromotionOperator {
  /** Bằng */
  EQUAL = "EQ",
  /** Lớn hơn */
  GREATER_THAN = "GT",
  /** Lớn hơn hoặc bằng */
  GREATER_THAN_OR_EQUAL = "GTE",
  /** Nhỏ hơn */
  LESS_THAN = "LT",
  /** Nhỏ hơn hoặc bằng */
  LESS_THAN_OR_EQUAL = "LTE",
  /** Thuộc danh sách */
  IN = "IN",
  /** Không thuộc danh sách */
  NOT_IN = "NOT_IN",
}

/**
 * Loại hành động khi thỏa điều kiện
 */
export enum PromotionActionType {
  /** Giảm số tiền cố định */
  DISCOUNT_FIXED = "DISCOUNT_FIXED",
  /** Giảm theo phần trăm */
  DISCOUNT_PERCENT = "DISCOUNT_PERCENT",
  /** Miễn phí vận chuyển */
  FREE_SHIPPING = "FREE_SHIPPING",
  /** Tặng quà */
  GIFT = "GIFT",
  /** Mua X tặng Y */
  BUY_X_GET_Y = "BUY_X_GET_Y",
}

export interface PromotionRule {
  id?: string;
  type: PromotionRuleType;
  operator: PromotionOperator;
  value: string;
}

export interface PromotionAction {
  id?: string;
  type: PromotionActionType;
  value: string;
  maxDiscountAmount?: number;
}

export interface Promotion {
  id: string;
  name: string;
  code?: string | null; // Optional - có thể không có mã
  description?: string;
  startDate: string; // ISO Date String
  endDate: string; // ISO Date String
  isActive: boolean;
  priority: number;
  usageLimit?: number | null;
  usedCount: number;
  rules: PromotionRule[];
  actions: PromotionAction[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePromotionDto {
  name: string;
  code?: string; // Optional - API cho phép null
  description?: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  priority?: number;
  usageLimit?: number | null;
  rules: Omit<PromotionRule, "id">[];
  actions: Omit<PromotionAction, "id">[];
}

export interface UpdatePromotionDto extends Partial<CreatePromotionDto> {}

/**
 * Response từ API validate promotion
 */
export interface PromotionValidationResult {
  valid: boolean;
  promotionId: string;
  promotionName: string;
  discountAmount: number;
  freeShipping: boolean;
  giftSkuIds: string[];
  message?: string;
}
