/**
 * =====================================================================
 * COMMON BARREL FILE - Tệp gom nhóm các tiện ích chung
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BARREL PATTERN:
 * - Đây là một "thùng chứa" (Barrel) giúp gom tất cả các export từ các file khác nhau trong cùng thư mục vào một nơi.
 * - Giúp việc import ở các file khác trở nên gọn gàng hơn (VD: `import { LoggerService, CacheService } from '@/common'`). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

// Core services
export * from '@core/cache/cache.service';
export * from '@core/logger/logger.service';
export * from '@core/interceptors/logging.interceptor';

// Module
export * from './common.module';

// Helpers
export * from './helpers';

// DTOs
export * from './dto/base.dto';

// Utils
export * from './utils';
