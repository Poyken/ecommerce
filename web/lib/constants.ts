/**
 * =====================================================================
 * CONSTANTS - Hằng số dùng chung trong ứng dụng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MAGIC NUMBERS:
 * - "Magic Number" là những số lạ hoắc trong code (VD: 3600, 100, 500).
 * - Đọc code sẽ không biết ý nghĩa. Định nghĩa thành constant giúp code sạch hơn.
 *
 * 2. CONFIGURATION:
 * - Tập trung tất cả cấu hình tại một nơi -> Dễ thay đổi, dễ tìm kiếm.
 * - Khi cần sửa timeout từ 5s -> 10s, chỉ cần sửa một chỗ.
 * =====================================================================
 */

// ============================================================================
// API & NETWORK
// ============================================================================
export const API_CONFIG = {
  /** Timeout cho các request thông thường (ms) */
  DEFAULT_TIMEOUT: 10000,
  /** Timeout cho upload file (ms) */
  UPLOAD_TIMEOUT: 60000,
  /** Delay giữa các lần retry (ms) */
  RETRY_DELAY: 1000,
} as const;

// ============================================================================
// CACHE
// ============================================================================
export const CACHE_TIMES = {
  /** Dữ liệu static (categories, brands) - 1 giờ */
  STATIC: 3600,
  /** Dữ liệu động (products listing) - 5 phút */
  DYNAMIC: 300,
  /** Dữ liệu real-time (cart, stock) - 30 giây */
  REALTIME: 30,
  /** Session timeout - 7 ngày */
  SESSION: 7 * 24 * 3600,
  /** Memory cache TTL - 10 giây */
  MEMORY: 10,
} as const;

// ============================================================================
// UI & UX
// ============================================================================
export const UI_CONFIG = {
  /** Thời gian debounce cho search input (ms) */
  SEARCH_DEBOUNCE: 200,
  /** Thời gian debounce cho filter (ms) */
  FILTER_DEBOUNCE: 300,
  /** Số lượng sản phẩm mỗi trang mặc định */
  PRODUCTS_PER_PAGE: 12,
  /** Số lượng sản phẩm hiển thị mobile */
  PRODUCTS_PER_PAGE_MOBILE: 8,

  /** Animation durations (ms) */
  ANIMATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  /** Breakpoints */
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536,
  },
} as const;

// ============================================================================
// VALIDATION
// ============================================================================
export const VALIDATION = {
  /** Password tối thiểu */
  PASSWORD_MIN_LENGTH: 8,
  /** Password tối đa */
  PASSWORD_MAX_LENGTH: 100,
  /** Tên tối thiểu */
  NAME_MIN_LENGTH: 2,
  /** Tên tối đa */
  NAME_MAX_LENGTH: 50,
  /** Review tối thiểu */
  REVIEW_MIN_LENGTH: 10,
  /** Review tối đa */
  REVIEW_MAX_LENGTH: 1000,
  /** File upload tối đa (bytes) */
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  /** Số lượng file upload tối đa */
  MAX_FILES: 5,
  /** Các định dạng ảnh được phép */
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
} as const;

// ============================================================================
// PRODUCT
// ============================================================================
export const PRODUCT_CONFIG = {
  /** Số lượng mua tối đa */
  MAX_QUANTITY: 99,
  /** Số lượng mua tối thiểu */
  MIN_QUANTITY: 1,
  /** Số sao rating tối đa */
  MAX_RATING: 5,
  /** Số sản phẩm liên quan hiển thị */
  RELATED_PRODUCTS_COUNT: 8,
  /** Số sản phẩm recently viewed */
  RECENTLY_VIEWED_COUNT: 10,
} as const;

// ============================================================================
// COOKIES
// ============================================================================
export const COOKIE_NAMES = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  CSRF_TOKEN: "csrf-token",
  LOCALE: "NEXT_LOCALE",
  THEME: "theme",
  GUEST_CART: "guest-cart",
} as const;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================
export const STORAGE_KEYS = {
  GUEST_CART: "guest-cart",
  RECENTLY_VIEWED: "recently-viewed",
  WISHLIST_GUEST: "wishlist-guest",
  SEARCH_HISTORY: "search-history",
  COMPARISON_LIST: "comparison-list",
} as const;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ============================================================================
// REGEX PATTERNS
// ============================================================================
export const PATTERNS = {
  /** Email validation */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Phone number VN */
  PHONE_VN: /^(0[3|5|7|8|9])+([0-9]{8})$/,
  /** Password (at least 1 uppercase, 1 lowercase, 1 number) */
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  /** URL */
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  /** Slug */
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;
