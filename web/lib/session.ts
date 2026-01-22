

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
  const cookieStore = await cookies();

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true, // JavaScript cannot read this
    secure: isProduction, // HTTPS only in production
    sameSite: "lax" as const, // Protection against CSRF
    path: "/",
  };

  // Access Token - Dùng để xác thực API requests
  // Thời hạn ngắn (15 phút) để giảm rủi ro nếu bị lộ
  cookieStore.set("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60, // 15 phút (seconds)
  });

  // Refresh Token - Dùng để lấy accessToken mới khi hết hạn
  // Thời hạn dài hơn (7 ngày) để user không phải login lại
  cookieStore.set("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60, // 7 ngày (seconds)
  });
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
