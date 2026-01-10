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
