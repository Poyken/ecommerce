import { nanoid } from "nanoid";
import { cookies, headers } from "next/headers";



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
