import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    userId: string;
    email?: string;
    tenantId?: string;
    roles?: string[];
    permissions: string[];
    jti?: string;
    [key: string]: unknown;
  };
}
/**
 * =====================================================================
 * REQUEST WITH USER - Interface mở rộng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TYPE AUGMENTATION:
 * - Express Request mặc định không có property `user`.
 * - Khi đi qua AuthGuard, ta gán user vào request.
 * - Interface này giúp TypeScript hiểu rằng `req.user` tồn tại và có các field admin/permissions. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
