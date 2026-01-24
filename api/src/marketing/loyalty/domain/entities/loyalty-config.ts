/**
 * =====================================================================
 * LOYALTY CONSTANTS - Domain Layer
 * =====================================================================
 */

export const LOYALTY_CONFIG = {
  POINTS_PER_AMOUNT: 10000, // Mỗi 10,000đ = 1 điểm
  POINT_VALUE: 1000, // 1 điểm = 1,000đ
  EXPIRY_DAYS: 365, // Điểm hết hạn sau 365 ngày
  MIN_REDEEM_POINTS: 10, // Tối thiểu 10 điểm mới được dùng
  MAX_REDEEM_PERCENT: 50, // Tối đa 50% giá trị đơn hàng
};
