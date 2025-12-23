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
  console.log(`[Session] Creating session. NODE_ENV=${process.env.NODE_ENV}`);
  const cookieStore = await cookies();

  // Access Token - Dùng để xác thực API requests
  // Thời hạn ngắn (15 phút) để giảm rủi ro nếu bị lộ
  cookieStore.set("accessToken", accessToken, {
    httpOnly: true, // JavaScript không thể đọc
    secure: process.env.NODE_ENV === "production", // HTTPS only trong production
    sameSite: "lax", // Bảo vệ CSRF, cho phép navigation requests
    path: "/", // Gửi với mọi request
    maxAge: 15 * 60, // 15 phút (seconds)
  });
  console.log("[Session] accessToken cookie set");

  // Refresh Token - Dùng để lấy accessToken mới khi hết hạn
  // Thời hạn dài hơn (7 ngày) để user không phải login lại
  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 ngày (seconds)
  });
  console.log("[Session] refreshToken cookie set");
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
