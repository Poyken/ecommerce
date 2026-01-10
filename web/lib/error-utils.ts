/**
 * =====================================================================
 * ERROR UTILS - Tiện ích xử lý lỗi
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. VẤN ĐỀ:
 * - Trong JS/TS, `error` trong catch block có kiểu `unknown` (có thể là Error, string, object, null...).
 * - Việc lấy message lỗi thường lặp đi lặp lại code kiểm tra (`instanceof Error`, check property...).
 *
 * 2. GIẢI PHÁP:
 * - `getErrorMessage(err)`: Hàm chuẩn hóa để LUÔN trả về string dễ đọc cho user.
 * - Các hàm kiểm tra loại lỗi (`isNetworkError`, `isUnauthorizedError`) để UI phản ứng phù hợp
 *   (VD: Mất mạng -> Show Toast báo kiểm tra kết nối; 401 -> Redirect login).
 * =====================================================================
 */
/**
 * =====================================================================
 * ERROR UTILITIES - Centralized Error Handling
 * =====================================================================
 */

/**
 * Extract a human-readable error message from any unknown error object.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object") {
    if ("message" in error) {
      return String((error as { message: unknown }).message);
    }
    if ("error" in error) {
      return String((error as { error: unknown }).error);
    }
  }
  return "Đã có lỗi xảy ra, vui lòng thử lại sau";
}

/**
 * Check if the error is a network-related error.
 */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    (error.message.includes("fetch") || error.message.includes("network"))
  );
}

/**
 * Check if the error is a timeout error.
 */
export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" ||
      error.message.toLowerCase().includes("timeout"))
  );
}

/**
 * Check if the error is an unauthorized/401 error.
 */
export function isUnauthorizedError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const status = (error as any)?.status;
  return (
    status === 401 ||
    message.includes("401") ||
    message.includes("unauthorized")
  );
}
