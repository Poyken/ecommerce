import { nanoid } from "nanoid";
import { cookies, headers } from "next/headers";

/**
 * =====================================================================
 * CSRF PROTECTION - Bảo vệ chống tấn công giả mạo request
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CSRF (Cross-Site Request Forgery) LÀ GÌ?
 * - Là tấn công khi hacker lừa trình duyệt của user gửi request đến server của ta.
 * - Vì browser tự động gửi cookie, server tưởng request là hợp lệ.
 *
 * 2. CƠ CHẾ "DOUBLE SUBMIT COOKIE":
 * - Server gửi 1 random token vào Cookie.
 * - Khi Client gửi form/API, Client phải đọc token từ Cookie và gửi kèm trong Header (x-csrf-token).
 * - Server so sánh: Cookie Token == Header Token -> Request hợp lệ.
 * - Tại sao an toàn? Hacker (web lạ) không thể đọc được cookie của web ta (Same Origin Policy),
 *   nên không thể lấy token để gắn vào header được.
 *
 * 3. TẠI SAO HTTPONLY = FALSE?
 * - Cookie này KHÔNG ĐƯỢC để HttpOnly, vì Javascript bên Client CẦN ĐỌC nó để gắn vào Header.
 * - (Khác với Session Cookie phải để HttpOnly).
 * =====================================================================
 */

const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Tạo và set CSRF token vào cookie.
 * Thường gọi sau khi Login thành công (Session Fixation protection).
 */
export async function generateCsrfToken() {
  const token = nanoid(32);
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    path: "/",
    httpOnly: false, // QUAN TRỌNG: Client cần đọc cookie này
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return token;
}

/**
 * Kiểm tra tính hợp lệ của request.
 * So sánh token trong Header và token trong Cookie.
 */
export async function validateCsrfToken() {
  const headerStore = await headers();
  const cookieStore = await cookies();

  const tokenFromHeader = headerStore.get(CSRF_HEADER_NAME);
  const tokenFromCookie = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  // Nếu thiếu một trong hai -> Từ chối
  if (!tokenFromHeader || !tokenFromCookie) {
    return false;
  }

  // So sánh khớp nhau -> Chấp thuận
  return tokenFromHeader === tokenFromCookie;
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
