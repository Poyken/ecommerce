/**
 * =====================================================================
 * SESSION MANAGEMENT - Quản lý phiên đăng nhập
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HTTP-ONLY COOKIES:
 * - Đây là phương pháp lưu trữ token an toàn nhất cho Web App.
 * - `httpOnly: true`: JavaScript (client-side) KHÔNG THỂ đọc được cookie này -> Chống XSS (Cross-Site Scripting).
 * - `secure: true`: Chỉ gửi qua HTTPS -> Chống nghe lén.
 *
 * 2. SESSION LIFECYCLE:
 * - Login -> Tạo Access Token (ngắn hạn) & Refresh Token (dài hạn).
 * - Request -> Browser tự động gửi Cookie.
 * - Logout -> Xóa Cookie.
 *
 * 3. SERVER-ONLY:
 * - File này chỉ chạy trên Server (Node.js environment) để thao tác với headers/cookies.
 * =====================================================================
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import "server-only";

/**
 * Tạo session mới sau khi đăng nhập thành công.
 * Lưu accessToken và refreshToken vào HttpOnly cookies.
 *
 * @param accessToken - JWT access token (thời hạn ngắn: 15 phút)
 * @param refreshToken - JWT refresh token (thời hạn dài: 7 ngày)
 *
 * @example
 * // Trong loginAction
 * const { accessToken, refreshToken } = response.data;
 * await createSession(accessToken, refreshToken);
 */
export async function createSession(accessToken: string, refreshToken: string) {
  const isProduction = process.env.NODE_ENV === "production";
  console.log(`[Session] Creating session. NODE_ENV=${process.env.NODE_ENV}`);
  console.log(`[Session] Access token length: ${accessToken?.length || 0}`);
  console.log(`[Session] Refresh token length: ${refreshToken?.length || 0}`);

  const cookieStore = await cookies();

  // Common cookie options
  const cookieOptions = {
    httpOnly: true, // JavaScript không thể đọc
    // FORCE FALSE FOR DEBUGGING
    secure: false, // isProduction, // HTTPS only trong production
    sameSite: "lax" as const, // Bảo vệ CSRF, cho phép navigation requests
    path: "/", // Gửi với mọi request
    // NOTE: Không set domain để cookie work với cả subdomain và main domain
    // Nếu set domain: ".yourdomain.com" sẽ không work với localhost
  };

  // Access Token - Dùng để xác thực API requests
  // Thời hạn ngắn (15 phút) để giảm rủi ro nếu bị lộ
  cookieStore.set("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60, // 15 phút (seconds)
  });
  console.log(
    `[Session] ✅ accessToken cookie set (Secure: ${isProduction}, SameSite: lax)`
  );

  // Refresh Token - Dùng để lấy accessToken mới khi hết hạn
  // Thời hạn dài hơn (7 ngày) để user không phải login lại
  cookieStore.set("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60, // 7 ngày (seconds)
  });
  console.log(
    `[Session] ✅ refreshToken cookie set (Secure: ${isProduction}, SameSite: lax)`
  );

  // Verify cookies were actually set
  const verifyAccess = cookieStore.get("accessToken");
  const verifyRefresh = cookieStore.get("refreshToken");
  console.log(
    `[Session] Verification - accessToken exists: ${!!verifyAccess?.value}`
  );
  console.log(
    `[Session] Verification - refreshToken exists: ${!!verifyRefresh?.value}`
  );
}

/**
 * Xóa session (đăng xuất).
 * Xóa cả accessToken và refreshToken khỏi cookies.
 *
 * @example
 * // Trong logoutAction
 * await deleteSession();
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}

/**
 * Lấy accessToken từ session hiện tại.
 * Dùng để kiểm tra user đã đăng nhập chưa.
 *
 * @returns accessToken nếu có, undefined nếu chưa đăng nhập
 *
 * @example
 * const token = await getSession();
 * if (!token) {
 *   redirect("/login");
 * }
 */
export async function getSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  return accessToken;
}

/**
 * Đăng xuất và redirect về trang login.
 * Kết hợp deleteSession() và redirect() trong một function.
 *
 * @example
 * // Trong logout button handler
 * await logout();
 */
export async function logout() {
  await deleteSession();
  redirect("/login");
}
