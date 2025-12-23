/**
 * =====================================================================
 * COMMON BARREL FILE - Tệp gom nhóm các tiện ích chung
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BARREL PATTERN:
 * - Đây là một "thùng chứa" (Barrel) giúp gom tất cả các export từ các file khác nhau trong cùng thư mục vào một nơi.
 * - Giúp việc import ở các file khác trở nên gọn gàng hơn (VD: `import { LoggerService, CacheService } from 'src/common'`).
 * =====================================================================
 */
export * from './cache.service';
export * from './common.module';
export * from './logger.service';
export * from './logging.interceptor';
