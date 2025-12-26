/**
 * =====================================================================
 * APPLICATION CONSTANTS - Centralized Configuration
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WHY CONSTANTS FILE?
 * - Tập trung tất cả "magic numbers" và "magic strings" vào một nơi.
 * - Dễ dàng điều chỉnh cho từng môi trường (dev, staging, prod).
 * - Tránh lỗi khi sửa giá trị (chỉ cần sửa 1 chỗ thay vì nhiều chỗ).
 *
 * 2. TYPE SAFETY:
 * - Sử dụng `as const` để TypeScript biết đây là constant (không thay đổi).
 * - Giúp IDE autocomplete và catch lỗi sớm.
 *
 * 3. ENVIRONMENT OVERRIDE:
 * - Các giá trị mặc định có thể override bằng .env variables.
 * - Production server có thể tune mà không cần đổi code.
 * =====================================================================
 */

/**
 * Authentication & Security Configuration
 */
export const AUTH_CONFIG = {
  /** Number of bcrypt rounds for password hashing (higher = slower but more secure) */
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),

  /** Access token expiration time (short-lived for security) */
  ACCESS_TOKEN_EXPIRES: process.env.JWT_ACCESS_EXPIRED || '15m',

  /** Refresh token expiration time (long-lived for convenience) */
  REFRESH_TOKEN_EXPIRES: process.env.JWT_REFRESH_EXPIRED || '7d',

  /** Time in seconds for refresh token expiration (for Redis TTL) */
  REFRESH_TOKEN_EXPIRES_SECONDS: 7 * 24 * 60 * 60, // 7 days

  /** Access token expiration in seconds (for blacklist TTL) */
  ACCESS_TOKEN_EXPIRES_SECONDS: 15 * 60, // 15 minutes

  /** Password reset token expiration in seconds */
  PASSWORD_RESET_TOKEN_EXPIRES: 60 * 60, // 1 hour

  /** Maximum failed login attempts before account lock */
  MAX_FAILED_LOGIN_ATTEMPTS: parseInt(
    process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5',
    10,
  ),

  /** Account lock duration in seconds after max failed attempts */
  ACCOUNT_LOCK_DURATION: 15 * 60, // 15 minutes
} as const;

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  /** Default cache TTL in seconds */
  DEFAULT_TTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10), // 5 minutes

  /** Permission cache TTL in seconds */
  PERMISSION_TTL: parseInt(process.env.CACHE_PERMISSION_TTL || '300', 10), // 5 minutes

  /** Product cache TTL in seconds */
  PRODUCT_TTL: parseInt(process.env.CACHE_PRODUCT_TTL || '600', 10), // 10 minutes

  /** Category cache TTL in seconds */
  CATEGORY_TTL: parseInt(process.env.CACHE_CATEGORY_TTL || '1800', 10), // 30 minutes

  /** User profile cache TTL in seconds */
  USER_PROFILE_TTL: parseInt(process.env.CACHE_USER_PROFILE_TTL || '300', 10), // 5 minutes

  /** Maximum number of items in memory cache */
  MAX_ITEMS: parseInt(process.env.CACHE_MAX_ITEMS || '100', 10),
} as const;

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMIT_CONFIG = {
  /** Global rate limit: requests per window */
  GLOBAL_LIMIT: parseInt(process.env.RATE_LIMIT_GLOBAL || '100', 10),

  /** Global rate limit: time window in milliseconds */
  GLOBAL_TTL: parseInt(process.env.RATE_LIMIT_GLOBAL_TTL || '60000', 10), // 60 seconds

  /** Auth endpoints rate limit (stricter for security) */
  AUTH_LIMIT: parseInt(process.env.RATE_LIMIT_AUTH || '5', 10),
  AUTH_TTL: parseInt(process.env.RATE_LIMIT_AUTH_TTL || '60000', 10), // 60 seconds

  /** Public API rate limit */
  PUBLIC_LIMIT: parseInt(process.env.RATE_LIMIT_PUBLIC || '100', 10),
  PUBLIC_TTL: parseInt(process.env.RATE_LIMIT_PUBLIC_TTL || '60000', 10),

  /** Admin API rate limit */
  ADMIN_LIMIT: parseInt(process.env.RATE_LIMIT_ADMIN || '50', 10),
  ADMIN_TTL: parseInt(process.env.RATE_LIMIT_ADMIN_TTL || '60000', 10),
} as const;

/**
 * Pagination Configuration
 */
export const PAGINATION_CONFIG = {
  /** Default page size for lists */
  DEFAULT_LIMIT: parseInt(process.env.PAGINATION_DEFAULT_LIMIT || '20', 10),

  /** Maximum page size to prevent abuse */
  MAX_LIMIT: parseInt(process.env.PAGINATION_MAX_LIMIT || '100', 10),

  /** Minimum page size */
  MIN_LIMIT: 1,

  /** Default page number */
  DEFAULT_PAGE: 1,
} as const;

/**
 * File Upload Configuration
 */
export const UPLOAD_CONFIG = {
  /** Maximum file size in bytes (10MB default) */
  MAX_FILE_SIZE: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '10485760', 10),

  /** Maximum number of files per upload */
  MAX_FILES: parseInt(process.env.UPLOAD_MAX_FILES || '10', 10),

  /** Allowed image formats */
  ALLOWED_IMAGE_FORMATS: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
  ],

  /** Allowed document formats */
  ALLOWED_DOCUMENT_FORMATS: ['application/pdf', 'application/msword'],
} as const;

/**
 * Email Configuration
 */
export const EMAIL_CONFIG = {
  /** Email sender name */
  FROM_NAME: process.env.EMAIL_FROM_NAME || 'E-commerce Platform',

  /** Email sender address */
  FROM_EMAIL: process.env.EMAIL_FROM || 'noreply@example.com',

  /** Email queue concurrency */
  QUEUE_CONCURRENCY: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY || '5', 10),

  /** Email retry attempts on failure */
  MAX_RETRY_ATTEMPTS: parseInt(process.env.EMAIL_MAX_RETRY || '3', 10),
} as const;

/**
 * Database Configuration
 */
export const DATABASE_CONFIG = {
  /** Connection pool size */
  POOL_SIZE: parseInt(process.env.DB_POOL_SIZE || '10', 10),

  /** Query timeout in milliseconds */
  QUERY_TIMEOUT: parseInt(process.env.DB_QUERY_TIMEOUT || '30000', 10),

  /** Enable query logging in development */
  LOG_QUERIES: process.env.NODE_ENV === 'development',
} as const;

/**
 * Queue Configuration
 */
export const QUEUE_CONFIG = {
  /** Default job attempts before giving up */
  DEFAULT_ATTEMPTS: parseInt(process.env.QUEUE_DEFAULT_ATTEMPTS || '3', 10),

  /** Delay between retry attempts in milliseconds */
  RETRY_DELAY: parseInt(process.env.QUEUE_RETRY_DELAY || '5000', 10),

  /** Job timeout in milliseconds */
  JOB_TIMEOUT: parseInt(process.env.QUEUE_JOB_TIMEOUT || '30000', 10),

  /** Remove completed jobs after (in milliseconds) */
  REMOVE_ON_COMPLETE_AGE: 24 * 60 * 60 * 1000, // 24 hours

  /** Remove failed jobs after (in milliseconds) */
  REMOVE_ON_FAIL_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

/**
 * Business Logic Configuration
 */
export const BUSINESS_CONFIG = {
  /** Welcome voucher value for new users (in VND) */
  WELCOME_VOUCHER_VALUE: parseInt(
    process.env.WELCOME_VOUCHER_VALUE || '50000',
    10,
  ),

  /** Welcome voucher validity in days */
  WELCOME_VOUCHER_VALIDITY: parseInt(
    process.env.WELCOME_VOUCHER_VALIDITY || '7',
    10,
  ),

  /** Maximum coupon usage per user */
  MAX_COUPON_USAGE_PER_USER: parseInt(process.env.MAX_COUPON_USAGE || '1', 10),

  /** Order cancellation grace period in minutes */
  ORDER_CANCELLATION_GRACE_PERIOD: parseInt(
    process.env.ORDER_CANCELLATION_GRACE_PERIOD || '30',
    10,
  ),

  /** Review minimum length in characters */
  REVIEW_MIN_LENGTH: parseInt(process.env.REVIEW_MIN_LENGTH || '10', 10),

  /** Review maximum length in characters */
  REVIEW_MAX_LENGTH: parseInt(process.env.REVIEW_MAX_LENGTH || '1000', 10),
} as const;

/**
 * Logging Configuration
 */
export const LOGGING_CONFIG = {
  /** Log level (error, warn, info, debug) */
  LEVEL: process.env.LOG_LEVEL || 'info',

  /** Enable request logging */
  LOG_REQUESTS: process.env.LOG_REQUESTS === 'true',

  /** Enable SQL query logging */
  LOG_SQL: process.env.LOG_SQL === 'true',

  /** Maximum log file size in MB */
  MAX_FILE_SIZE: parseInt(process.env.LOG_MAX_FILE_SIZE || '10', 10),

  /** Maximum number of log files to keep */
  MAX_FILES: parseInt(process.env.LOG_MAX_FILES || '5', 10),
} as const;

/**
 * Security Headers Configuration
 */
export const SECURITY_HEADERS = {
  /** Content Security Policy directives */
  CSP_DIRECTIVES: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // TODO: Remove unsafe-* after Swagger optimization
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https:', 'https://res.cloudinary.com'],
    connectSrc: ["'self'", 'https://api.vnpay.vn'],
    frameAncestors: ["'self'"],
  },

  /** HSTS max age in seconds */
  HSTS_MAX_AGE: 31536000, // 1 year
} as const;

/**
 * Helper function to get all configuration as a single object
 * Useful for logging or debugging
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
