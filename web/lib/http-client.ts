import { env } from "./env";

/**
 * =====================================================================
 * CLIENT-SIDE HTTP CLIENT
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CLIENT-ONLY:
 * - Chỉ dành cho Client Components.
 * - Chạy trong browser, cookies tự động được gửi theo.
 *
 * 2. BROWSER NATIVE:
 * - Sử dụng native fetch API của browser.
 * - Cookies được browser tự động quản lý (httpOnly cookies).
 * - CSRF token đọc từ cookie client-side.
 *
 * 3. ERROR HANDLING:
 * - Tự động redirect về /login khi 401 (client-side navigation).
 * - Parse error message từ API.
 * - User-friendly error display.
 * =====================================================================
 */

type ClientFetchOptions = RequestInit & {
  /** Query parameters - will be appended to URL */
  params?: Record<string, string | number | boolean | undefined>;
  /** Skip redirect to login on 401 */
  skipRedirectOn401?: boolean;
};

/**
 * Get CSRF token from cookies (client-side)
 */
function getCSRFToken(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Client-side HTTP client for API calls from Client Components
 *
 * @template T - Expected response data type
 * @param path - API endpoint path (e.g., "/products", "/cart")
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws Error if request fails (with API error message)
 *
 * @example
 * // In Client Component
 * "use client";
 * const { data } = useSWR("/products", httpClient);
 *
 * @example
 * // In event handler
 * async function handleAddToCart() {
 *   await httpClient("/cart", {
 *     method: "POST",
 *     body: JSON.stringify({ skuId, quantity: 1 }),
 *   });
 * }
 */
export async function httpClient<T>(
  path: string,
  options: ClientFetchOptions = {}
): Promise<T> {
  const { params, headers: customHeaders, ...rest } = options;

  // ========================================
  // 1. BUILD URL
  // ========================================
  const apiUrl = env.NEXT_PUBLIC_API_URL;
  const baseUrl = apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(cleanPath, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // ========================================
  // 2. BUILD HEADERS
  // ========================================
  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(
    rest.method?.toUpperCase() || "GET"
  );

  const csrfToken = isStateChanging ? getCSRFToken() : null;

  const requestHeaders: Record<string, string> = {
    "X-CSRF-Token": csrfToken || "",
    ...(customHeaders as Record<string, string>),
  };

  // Only add Content-Type for non-FormData bodies
  if (!(rest.body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  // ========================================
  // 3. EXECUTE REQUEST
  // ========================================
  console.log(`[HTTP Client] ${rest.method || "GET"} ${url.toString()}`);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: requestHeaders,
      credentials: "include", // Important: Send cookies with request
      ...rest,
    });
  } catch (error) {
    console.error(`[HTTP Client] Network error:`, error);
    throw new Error(
      `Failed to reach API: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  // ========================================
  // 4. HANDLE ERRORS
  // ========================================
  if (!res.ok) {
    let errorMessage = `API Error: ${res.status} ${res.statusText}`;
    let errorBody: unknown = null;

    try {
      errorBody = await res.json();
      if (errorBody && typeof errorBody === "object") {
        const body = errorBody as Record<string, unknown>;
        const rawMessage = body.message || body.error;

        if (Array.isArray(rawMessage)) {
          errorMessage = rawMessage.join(", ");
        } else if (typeof rawMessage === "string") {
          errorMessage = rawMessage;
        }
      }
    } catch {
      // Keep default message if JSON parsing fails
    }

    // Client-side redirect on 401
    const isUserNotFound = res.status === 404;
    if ((res.status === 401 || isUserNotFound) && !options.skipRedirectOn401) {
      console.warn(
        `[HTTP Client] ${
          isUserNotFound ? "User Not Found" : "Unauthorized"
        } - Redirecting to /login`
      );
      window.location.href = "/login";
      // Return a promise that never resolves to prevent further execution
      return new Promise<T>(() => {});
    }

    const error = new Error(errorMessage) as Error & {
      status: number;
      body: unknown;
    };
    error.status = res.status;
    error.body = errorBody;

    console.error(
      `[HTTP Client Error] ${res.status} ${url.toString()}: ${errorMessage}`
    );

    throw error;
  }

  // ========================================
  // 5. PARSE AND RETURN
  // ========================================
  if (res.status === 204) {
    return null as T;
  }

  const data = await res.json();
  return data as T;
}
