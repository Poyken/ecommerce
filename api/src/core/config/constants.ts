/**
 * =====================================================================
 * APP CONSTANTS
 * =====================================================================
 */

/**
 * Cấu hình Xác thực & Bảo mật (Authentication)
 */
export const AUTH_CONFIG = {
  /** Số vòng lặp băm mật khẩu (bcrypt). Càng cao càng an toàn nhưng tốn CPU. */
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),

  /** Thời gian sống của Access Token (ngắn để bảo mật, thường 15-30p) */
  ACCESS_TOKEN_EXPIRES: process.env.JWT_ACCESS_EXPIRED || '15m',

  /** Thời gian sống của Refresh Token (dài để tiện dụng, thường 7-30 ngày) */
  REFRESH_TOKEN_EXPIRES: process.env.JWT_REFRESH_EXPIRED || '7d',

  /** Thời gian hết hạn Refresh Token tính bằng giây (dùng cho Redis TTL) */
  REFRESH_TOKEN_EXPIRES_SECONDS: 7 * 24 * 60 * 60, // 7 ngày

  /** Thời gian hết hạn Access Token tính bằng giây (dùng cho Blacklist TTL) */
  ACCESS_TOKEN_EXPIRES_SECONDS: 15 * 60, // 15 phút

  /** Thời gian hết hạn của token reset mật khẩu (Email link) */
  PASSWORD_RESET_TOKEN_EXPIRES: 60 * 60, // 1 giờ

  /** Số lần đăng nhập sai tối đa trước khi khóa tài khoản tạm thời */
  MAX_FAILED_LOGIN_ATTEMPTS: parseInt(
    process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5',
    10,
  ),

  /** Thời gian khóa tài khoản sau khi đăng nhập sai quá nhiều (giây) */
  ACCOUNT_LOCK_DURATION: 15 * 60, // 15 phút

  /** Cookie Options for Refresh Token */
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
} as const;

/**
 * Cấu hình Cache (Lưu trữ tạm thời)
 */
export const CACHE_CONFIG = {
  /** Thời gian tồn tại mặc định của Cache (giây) */
  DEFAULT_TTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10), // 5 phút

  /** TTL cho Cache Phân quyền (Permissions) */
  PERMISSION_TTL: parseInt(process.env.CACHE_PERMISSION_TTL || '300', 10), // 5 phút

  /** TTL cho Cache Sản phẩm (ít thay đổi nên có thể để lâu) */
  PRODUCT_TTL: parseInt(process.env.CACHE_PRODUCT_TTL || '600', 10), // 10 phút

  /** TTL cho Cache Danh mục (rất ít thay đổi) */
  CATEGORY_TTL: parseInt(process.env.CACHE_CATEGORY_TTL || '1800', 10), // 30 phút

  /** TTL cho Cache Hồ sơ người dùng */
  USER_PROFILE_TTL: parseInt(process.env.CACHE_USER_PROFILE_TTL || '300', 10), // 5 phút

  /** Số lượng item tối đa trong Memory Cache (để tránh tràn RAM) */
  MAX_ITEMS: parseInt(process.env.CACHE_MAX_ITEMS || '100', 10),
} as const;

/**
 * Cấu hình Rate Limiting (Giới hạn truy cập chống Spam/DDoS)
 */
export const RATE_LIMIT_CONFIG = {
  /** Giới hạn chung toàn hệ thống: số request tối đa */
  GLOBAL_LIMIT: parseInt(process.env.RATE_LIMIT_GLOBAL || '100', 10),

  /** Cửa sổ thời gian cho giới hạn chung (milliseconds) */
  GLOBAL_TTL: parseInt(process.env.RATE_LIMIT_GLOBAL_TTL || '60000', 10), // 1 phút

  /** Giới hạn cho API Auth (Login/Register) - Cần chặt chẽ hơn */
  AUTH_LIMIT: parseInt(process.env.RATE_LIMIT_AUTH || '5', 10),
  AUTH_TTL: parseInt(process.env.RATE_LIMIT_AUTH_TTL || '60000', 10), // 1 phút

  /** Giới hạn cho Public API (Khách vãng lai) */
  PUBLIC_LIMIT: parseInt(process.env.RATE_LIMIT_PUBLIC || '100', 10),
  PUBLIC_TTL: parseInt(process.env.RATE_LIMIT_PUBLIC_TTL || '60000', 10),

  /** Giới hạn cho Admin API (Thư thả hơn) */
  ADMIN_LIMIT: parseInt(process.env.RATE_LIMIT_ADMIN || '50', 10),
  ADMIN_TTL: parseInt(process.env.RATE_LIMIT_ADMIN_TTL || '60000', 10),
} as const;

/**
 * Cấu hình Phân trang (Pagination)
 */
export const PAGINATION_CONFIG = {
  /** Số lượng item mặc định trên 1 trang */
  DEFAULT_LIMIT: parseInt(process.env.PAGINATION_DEFAULT_LIMIT || '20', 10),

  /** Số lượng item tối đa cho phép (tránh user query 1 triệu record làm sập DB) */
  MAX_LIMIT: parseInt(process.env.PAGINATION_MAX_LIMIT || '100', 10),

  /** Số lượng tối thiểu */
  MIN_LIMIT: 1,

  /** Trang mặc định (Trang 1) */
  DEFAULT_PAGE: 1,
} as const;

/**
 * Cấu hình Upload File (Ảnh/Tài liệu)
 */
export const UPLOAD_CONFIG = {
  /** Kích thước file tối đa (bytes). Mặc định 10MB */
  MAX_FILE_SIZE: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760', 10),

  /** Số lượng file tối đa trong 1 lần upload */
  MAX_FILES: parseInt(process.env.UPLOAD_MAX_FILES || '10', 10),

  /** Các định dạng ảnh cho phép */
  ALLOWED_IMAGE_FORMATS: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
  ],

  /** Các định dạng tài liệu cho phép */
  ALLOWED_DOCUMENT_FORMATS: ['application/pdf', 'application/msword'],
} as const;

/**
 * Cấu hình Email
 */
export const EMAIL_CONFIG = {
  /** Tên người gửi hiển thị trong Email */
  FROM_NAME: process.env.EMAIL_FROM_NAME || 'E-commerce Platform',

  /** Địa chỉ email người gửi (No-reply) */
  FROM_EMAIL: process.env.EMAIL_FROM || 'noreply@example.com',

  /** Độ song song khi gửi email (Số worker chạy cùng lúc) */
  QUEUE_CONCURRENCY: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY || '5', 10),

  /** Số lần thử lại tối đa nếu gửi thất bại */
  MAX_RETRY_ATTEMPTS: parseInt(process.env.EMAIL_MAX_RETRY || '3', 10),
} as const;

/**
 * Cấu hình Database (PostgreSQL)
 */
export const DATABASE_CONFIG = {
  /** Số lượng kết nối trong Connection Pool */
  POOL_SIZE: parseInt(process.env.DB_POOL_SIZE || '10', 10),

  /** Thời gian chờ tối đa cho 1 query (ms) */
  QUERY_TIMEOUT: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),

  /** Có log câu lệnh SQL ra console không? (Chỉ bật ở Dev) */
  LOG_QUERIES: process.env.NODE_ENV === 'development',
} as const;

/**
 * Cấu hình Hàng đợi (Queue - BullMQ/Redis)
 */
export const QUEUE_CONFIG = {
  /** Số lần thử lại mặc định cho Job */
  DEFAULT_ATTEMPTS: parseInt(process.env.QUEUE_DEFAULT_ATTEMPTS || '3', 10),

  /** Thời gian chờ giữa các lần thử lại (ms) */
  RETRY_DELAY: parseInt(process.env.QUEUE_RETRY_DELAY || '5000', 10),

  /** Thời gian tối đa để xử lý 1 Job (timeout) */
  JOB_TIMEOUT: parseInt(process.env.QUEUE_JOB_TIMEOUT || '30000', 10),

  /** Xóa Job đã hoàn thành sau bao lâu (ms) - 24 giờ */
  REMOVE_ON_COMPLETE_AGE: 24 * 60 * 60 * 1000,

  /** Xóa Job thất bại sau bao lâu (ms) - 7 ngày để debug */
  REMOVE_ON_FAIL_AGE: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Cấu hình Nghiệp vụ (Business Logic)
 */
export const BUSINESS_CONFIG = {
  /** Giá trị voucher chào mừng cho user mới (VND) */
  WELCOME_VOUCHER_VALUE: parseInt(
    process.env.WELCOME_VOUCHER_VALUE || '50000',
    10,
  ),

  /** Thời hạn voucher chào mừng (ngày) */
  WELCOME_VOUCHER_VALIDITY: parseInt(
    process.env.WELCOME_VOUCHER_VALIDITY || '7',
    10,
  ),

  /** Số lần tối đa User được dùng 1 mã giảm giá */
  MAX_COUPON_USAGE_PER_USER: parseInt(process.env.MAX_COUPON_USAGE || '1', 10),

  /** Thời gian ân hạn cho phép hủy đơn hàng (phút) */
  ORDER_CANCELLATION_GRACE_PERIOD: parseInt(
    process.env.ORDER_CANCELLATION_GRACE_PERIOD || '30',
    10,
  ),

  /** Độ dài tối thiểu của nội dung đánh giá */
  REVIEW_MIN_LENGTH: parseInt(process.env.REVIEW_MIN_LENGTH || '10', 10),

  /** Độ dài tối đa của nội dung đánh giá */
  REVIEW_MAX_LENGTH: parseInt(process.env.REVIEW_MAX_LENGTH || '1000', 10),
} as const;

/**
 * Cấu hình Logging (Nhật ký hệ thống)
 */
export const LOGGING_CONFIG = {
  /** Mức độ log (error, warn, info, debug) */
  LEVEL: process.env.LOG_LEVEL || 'info',

  /** Có log toàn bộ HTTP requests không? */
  LOG_REQUESTS: process.env.LOG_REQUESTS === 'true',

  /** Có log các câu SQL queries không? */
  LOG_SQL: process.env.LOG_SQL === 'true',

  /** Kích thước tối đa của 1 file log (MB) */
  MAX_FILE_SIZE: parseInt(process.env.LOG_MAX_FILE_SIZE || '10', 10),

  /** Số lượng file log cũ tối đa được giữ lại (Log Rotation) */
  MAX_FILES: parseInt(process.env.LOG_MAX_FILES || '5', 10),
} as const;

/**
 * Cấu hình HTTP Security Headers (Helmet)
 */
export const SECURITY_HEADERS = {
  /** Content Security Policy (CSP) - Kiểm soát nguồn tài nguyên được tải */
  CSP_DIRECTIVES: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // TODO: Xóa unsafe-* sau khi tối ưu Swagger
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https:', 'https://res.cloudinary.com'],
    connectSrc: ["'self'", 'https://api.vnpay.vn'],
    frameAncestors: ["'self'"],
  },

  /** HSTS (HTTP Strict Transport Security) - Bắt buộc dùng HTTPS trong 1 năm */
  HSTS_MAX_AGE: 31536000,
} as const;

/**
 * Hàm Helper để lấy toàn bộ config dưới dạng Object
 * Dùng để debug xem server đang chạy với cấu hình nào
 */
export function getAllConfig() {
  return {
    auth: AUTH_CONFIG,
    cache: CACHE_CONFIG,
    rateLimit: RATE_LIMIT_CONFIG,
    pagination: PAGINATION_CONFIG,
    upload: UPLOAD_CONFIG,
    email: EMAIL_CONFIG,
    database: DATABASE_CONFIG,
    queue: QUEUE_CONFIG,
    business: BUSINESS_CONFIG,
    logging: LOGGING_CONFIG,
    security: SECURITY_HEADERS,
  };
}

/**
 * Type helper to ensure exhaustive configuration
 */
export type AppConfig = ReturnType<typeof getAllConfig>;
