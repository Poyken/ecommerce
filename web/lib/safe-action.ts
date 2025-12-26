import { createSafeActionClient } from "next-safe-action";
import { cookies, headers } from "next/headers";
import { validateCsrfToken } from "./csrf";

/**
 * =====================================================================
 * SAFE ACTION CLIENT - Middleware cho Server Actions
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. KHÁI NIỆM "BASE CLIENT":
 * - Thay vì viết `export async function myAction()` trần trụi, ta dùng `actionClient` (factory).
 * - Lợi ích: Tự động catch lỗi (try/catch global), type safety cho input/output từ thư viện `next-safe-action`.
 *
 * 2. MIDDLEWARE CHAIN (Chuỗi kiểm duyệt):
 * - `protectedActionClient` là phiên bản nâng cấp có thêm lớp bảo vệ.
 * - Nó chèn thêm Logic kiểm tra (Middleware) trước khi Action chính được chạy:
 *   + Bước 1: CSRF Check (Chống giả mạo request từ site lạ).
 *   + Bước 2: Auth Check (User đã login chưa?).
 *
 * 3. DEPENDENCY INJECTION (CONTEXT):
 * - Nếu pass qua middleware, ta trả về `ctx` (Context).
 * - Action chính sẽ nhận được `ctx` (VD: `accessToken`, `user`) mà không cần query lại DB.
 * - Giảm lặp code và query thừa.
 * =====================================================================
 */

/**
 * 1. Base Client: Cấu hình cơ bản (Xử lý lỗi chung)
 */
export const actionClient = createSafeActionClient({
  handleServerError(e) {
    // Log lỗi ra server console
    console.error("Action Error:", e);

    // Trả về message an toàn cho Client (không lộ stack trace)
    if (e instanceof Error) {
      return e.message;
    }
    return "An unknown error occurred.";
  },
});

/**
 * 2. Protected Client: Dành cho các hành động cần đăng nhập và bảo mật cao
 */
export const protectedActionClient = actionClient.use(async ({ next }) => {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("host");

  // --- BƯỚC 1: BẢO VỆ CSRF (Cross-Site Request Forgery) ---

  // Cách 1: Kiểm tra Token (Mạnh nhất)
  // So sánh header `x-csrf-token` xem có khớp với cookie `csrf_token` không
  const isCsrfTokenValid = await validateCsrfToken();

  // Cách 2: Kiểm tra Origin (Fallback)
  // Nếu request đến từ đúng domain của chúng ta (Same Origin) -> Tạm chấp nhận
  // (Server Actions của Next.js mặc định cũng check cái này, nhưng ta làm rõ ràng hơn)
  let isSafe = isCsrfTokenValid;

  if (!isSafe) {
    // Nếu không có Token (VD format form data thường), check Origin
    // Lưu ý: "host" có thể chứa port (localhost:3000), "origin" có protocol (http://localhost:3000)
    if (origin && host && origin.includes(host)) {
      isSafe = true;
    }
  }

  // Cảnh báo nếu chỉ pass qua Origin check mà thiếu Token (để debug)
  if (!isCsrfTokenValid && isSafe) {
    // console.warn("Access allowed via Origin Check (Missing CSRF Token)");
  }

  // Nếu cả 2 cách đều fail -> Chặn ngay lập tức
  if (!isSafe) {
    throw new Error(
      "CSRF Security Violation: Request blocked due to invalid origin or missing token."
    );
  }

  // --- BƯỚC 2: KIỂM TRA ĐĂNG NHẬP (Authentication) ---
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    throw new Error(
      "Unauthorized: You must be logged in to perform this action."
    );
  }

  // --- BƯỚC 3: TRUYỀN CONTEXT CHO ACTION CHÍNH ---
  // Trả về token để action chính dùng (gọi API backend)
  return next({ ctx: { accessToken: token } });
});
