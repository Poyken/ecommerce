/**
 * =====================================================================
 * PERMISSION UTILITIES - Tiện ích xử lý quyền truy cập
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. JWT STRUCTURE (JSON Web Token):
 * - Header: Thuật toán mã hóa.
 * - Payload: Dữ liệu (Claims) như `sub` (userId), `permissions`, `exp` (hết hạn).
 * - Signature: Chữ ký bảo mật.
 *
 * 2. STATELESS VERIFICATION:
 * - Server không cần lưu session trong database.
 * - Chỉ cần verify chữ ký của token là biết user là ai, có quyền gì.
 * - Ở client, ta chỉ cần `decode` payload để lấy thông tin hiển thị UI (không verify signature vì không có secret key).
 *
 * 3. SECURITY NOTE:
 * - Không bao giờ tin tưởng tuyệt đối dữ liệu decode từ client cho các thao tác quan trọng.
 * - Luôn phải verify lại token ở phía Server (API Backend).
 * =====================================================================
 */

import { decodeJwt } from "jose";

/**
 * Trích xuất danh sách permissions từ JWT access token.
 *
 * @param token - JWT access token (hoặc undefined/null nếu chưa đăng nhập)
 * @returns Mảng permission strings, hoặc mảng rỗng nếu không có token
 *
 * @example
 * // Trong AuthProvider
 * const token = cookieStore.get("accessToken")?.value;
 * const permissions = getPermissionsFromToken(token);
 * // → ["read:products", "write:orders", ...]
 *
 * @example
 * // Kiểm tra quyền
 * const permissions = getPermissionsFromToken(token);
 * if (permissions.includes("admin:users")) {
 *   // Hiển thị link Admin Users
 * }
 */
export function getPermissionsFromToken(
  token: string | undefined | null
): string[] {
  // Nếu không có token → trả về mảng rỗng (guest user)
  if (!token) return [];

  try {
    // decodeJwt() chỉ decode payload, không verify signature
    // (Verification đã được làm ở API middleware)
    const payload = decodeJwt(token);

    // Trả về permissions array từ payload, hoặc mảng rỗng nếu không có
    return (payload.permissions as string[]) || [];
  } catch {
    // Token invalid hoặc expired → trả về mảng rỗng
    return [];
  }
}

/**
 * Trích xuất User ID từ JWT access token.
 *
 * @param token - JWT access token
 * @returns User ID string hoặc null nếu không có token/invalid
 */
export function getUserIdFromToken(
  token: string | undefined | null
): string | null {
  if (!token) return null;
  try {
    const payload = decodeJwt(token);
    return payload.sub || null;
  } catch {
    return null;
  }
}
