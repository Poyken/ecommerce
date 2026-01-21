import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * =====================================================================
 * GET USER DECORATOR - Decorator lấy thông tin người dùng từ Request
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PARAM DECORATOR:
 * - Đây là một Decorator dành cho tham số của hàm (Param Decorator).
 * - Nó giúp ta lấy dữ liệu từ đối tượng Request một cách gọn gàng mà không cần phải viết `req.user` lặp đi lặp lại.
 *
 * 2. EXECUTION CONTEXT:
 * - `ExecutionContext` cho phép ta truy cập vào các thông tin của request hiện tại (HTTP, RPC, hoặc WebSockets).
 * - Ở đây ta dùng `switchToHttp().getRequest()` để lấy đối tượng Request của HTTP.
 *
 * 3. FLEXIBILITY:
 * - Nếu dùng `@GetUser()`, ta lấy toàn bộ object user.
 * - Nếu dùng `@GetUser('id')`, ta chỉ lấy trường `id` của user. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user?.[data];
    }
    return request.user;
  },
);
