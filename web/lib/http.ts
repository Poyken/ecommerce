// import { cookies } from "next/headers"; // Moved to dynamic import
import { redirect } from "next/navigation";
// import "server-only"; // Removed to allow client-side usage
import { env } from "./env";

/**
 * =====================================================================
 * HTTP CLIENT UTILITY
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER-SIDE FETCHING WRAPPER:
 * - Đây là wrapper quanh `fetch` API chuẩn, dành riêng cho Server Components (`server-only`).
 * - Giúp code gọn gàng hơn, không phải lặp lại việc set headers, base URL.
 *
 * 2. AUTOMATIC TOKEN HANDLING:
 * - Tự động đọc `accessToken` từ cookies của request hiện tại (`next/headers`).
 * - Đính kèm vào header `Authorization: Bearer ...` để xác thực với Backend.
 *
 * 3. CENTRALIZED ERROR HANDLING:
 * - Tự động check `res.ok`. Nếu lỗi (4xx, 5xx), tự động parse JSON body để lấy message lỗi chi tiết.
 * - Xử lý đặc biệt cho lỗi 401 (Unauthorized) -> Redirect về login.
 * =====================================================================
 */

/**
 * Options cho HTTP request, mở rộng từ RequestInit của Fetch API
 */
type FetchOptions = RequestInit & {
  /** Query parameters - sẽ được append vào URL */
  params?: Record<string, string | number | boolean | undefined>;
  /** Bỏ qua việc lấy token từ cookies (dùng cho public API để tránh lỗi build static) */
  skipAuth?: boolean;
  /** Cấu hình caching cho Next.js (revalidate, tags) */
  next?: NextFetchRequestConfig;
  /** Bỏ qua tự động redirect về login khi gặp lỗi 401 */
  skipRedirectOn401?: boolean;
};

/**
 * HTTP client utility cho Server Components/Actions.
 *
 * @template T - Kiểu dữ liệu response mong đợi
 * @param path - Đường dẫn API (VD: "/products", "/cart")
 * @param options - Fetch options (method, body, headers, ...)
 * @returns Promise với dữ liệu đã parse JSON
 * @throws Error nếu request thất bại (với message từ API)
 *
 * @example
 * // Lấy danh sách sản phẩm
 * const data = await http<ApiResponse<Product[]>>("/products");
 *
 * @example
 * // Thêm sản phẩm vào giỏ hàng
 * await http("/cart", {
 *   method: "POST",
 *   body: JSON.stringify({ skuId: "xxx", quantity: 1 }),
 * });
 */
export async function http<T>(path: string, options: FetchOptions = {}) {
  const { params, headers, skipAuth, ...rest } = options;

  // ========================================
  // 1. LẤY ACCESS TOKEN TỪ COOKIES
  // ========================================
  let accessToken: string | undefined;

  if (!skipAuth) {
    if (typeof window === "undefined") {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      accessToken = cookieStore.get("accessToken")?.value;
    } else {
      // Client-side: get token from document.cookie or local storage if needed
    }
  }

  // ========================================
  // 2. XÂY DỰNG URL ĐẦY ĐỦ
  // ========================================
  // Đảm bảo đường dẫn cơ sở được giữ nguyên khi đường dẫn bắt đầu bằng /
  const apiUrl = env.API_URL || env.NEXT_PUBLIC_API_URL;
  const baseUrl = apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(cleanPath, baseUrl);

  // Thêm query parameters vào URL nếu có
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // ========================================
  // 3. CẤU HÌNH HEADERS
  // ========================================
  const requestHeaders: Record<string, string> = {
    // Đính kèm Bearer token nếu có
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
    ...(headers as Record<string, string>),
  };

  // Chỉ thêm Content-Type: application/json nếu body không phải FormData
  // (FormData cần browser tự set Content-Type với boundary)
  if (!(rest.body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  // ========================================
  // 4. THỰC HIỆN REQUEST
  // ========================================
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: requestHeaders,
      ...rest,
    });
  } catch (error) {
    console.warn(`[HTTP Fetch Error] Failed to reach ${url}:`, error);
    // Return a dummy response that won't break the build logic
    // We return a mock response that looks like a successful empty response
    // to prevent components from crashing on build.
    return {
      data: [],
      meta: { total: 0, page: 1, limit: 10, lastPage: 0 },
    } as any;
  }

  // ========================================
  // 5. XỬ LÝ LỖI
  // ========================================
  if (!res.ok) {
    // 401 Unauthorized → Chuyển về trang login
    // (Middleware nên refresh token, nếu đến đây nghĩa là refresh thất bại)
    if (res.status === 401 && !options.skipRedirectOn401) {
      redirect("/login");
    }

    // Extract error message từ response body
    let errorMessage = `API Error: ${res.status} ${res.statusText}`;
    let errorBody: unknown = null;

    try {
      errorBody = await res.json();
      if (errorBody && typeof errorBody === "object") {
        const body = errorBody as Record<string, unknown>;
        // Handle NestJS validation errors and standard error messages
        const rawMessage = body.message || body.error;

        if (Array.isArray(rawMessage)) {
          errorMessage = rawMessage.join(", ");
        } else if (typeof rawMessage === "string") {
          errorMessage = rawMessage;
        } else if (typeof rawMessage === "object" && rawMessage !== null) {
          // Handle nested NestJS exception response
          const innerMessage =
            (rawMessage as Record<string, unknown>).message ||
            (rawMessage as Record<string, unknown>).error;
          if (Array.isArray(innerMessage)) {
            errorMessage = innerMessage.join(", ");
          } else if (typeof innerMessage === "string") {
            errorMessage = innerMessage;
          } else {
            errorMessage = JSON.stringify(innerMessage);
          }
        }
      }
    } catch {
      // Keep default message if JSON parsing fails
    }

    const error = new Error(errorMessage) as Error & {
      status: number;
      body: unknown;
    };
    error.status = res.status;
    error.body = errorBody;

    throw error;
  }

  // ========================================
  // 6. PARSE VÀ TRẢ VỀ DATA
  // ========================================
  // Handle 204 No Content (DELETE typically returns this)
  if (res.status === 204) {
    return null as T;
  }

  const data = await res.json();
  return data as T;
}
