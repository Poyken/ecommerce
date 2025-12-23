import { SetMetadata } from '@nestjs/common';

/**
 * =====================================================================
 * PERMISSIONS DECORATOR - Decorator đánh dấu quyền truy cập
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CUSTOM DECORATOR:
 * - NestJS cho phép ta tạo ra các Decorator riêng để gắn thông tin bổ sung (Metadata) vào các hàm hoặc class.
 *
 * 2. METADATA:
 * - `SetMetadata` lưu trữ mảng các quyền (`permissions`) vào một key đặc biệt là `PERMISSIONS_KEY`.
 * - Thông tin này sau đó sẽ được `PermissionsGuard` đọc ra để quyết định xem người dùng có được phép thực hiện hành động đó hay không.
 *
 * 3. USAGE:
 * - Ví dụ: `@Permissions('product:create')` gắn vào một API sẽ báo hiệu rằng chỉ ai có quyền tạo sản phẩm mới được vào.
 * =====================================================================
 */

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
