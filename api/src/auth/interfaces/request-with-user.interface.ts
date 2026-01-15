import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    userId: string;
    email: string;
    permissions: string[];
    jti?: string;
    [key: string]: any;
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
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
