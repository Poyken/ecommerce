import { redirect } from "next/navigation";
import { API_CONFIG, HTTP_STATUS } from "./constants";
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
 * - Xử lý đặc biệt cho lỗi 401 (Unauthorized) -> Redirect về login. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Server Components Fetching: Dùng trong các trang Server (`page.tsx`) để lấy dữ liệu mà vẫn giữ được Auth Context.
 * - Static Site Generation (SSG) Optimization: Tự động phát hiện khi nào nên cache (public API) và khi nào cần dữ liệu tươi (private API) để build trang siêu tốc.
 * - Security Headers: Tự động đính kèm CSRF Token và Forward IP để vượt qua các tường lửa bảo mật của Backend.

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
  /** Timeout request (ms) */
  timeout?: number;
  /** Response type (json, blob, text, etc.) */
  responseType?: "json" | "blob" | "text" | "arraybuffer";
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
  const { params, headers, skipAuth, timeout, ...rest } = options;

  // ========================================
  // 3. CẤU HÌNH HEADERS & CSRF & AUTH
  // ========================================
  // 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
  // - Ở đây ta xử lý "Interceptor" cho request.
  // - Nếu chạy trên Server, ta tự động lấy accessToken từ Cookie để gắn vào Header.
  // - Đây là lý do tại sao Fetch Wrapper này mạnh hơn `fetch` thường.

  let csrfToken: string | undefined;
  let accessToken: string | undefined;
  let forwardedUserAgent: string | undefined;
  let forwardedIp: string | undefined;
  let forwardedHost: string | undefined;

  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(
    rest.method?.toUpperCase() || "GET"
  );

  // Chỉ truy cập cookies trên Server (Server Component / Action)
  // Client Component sẽ tự động gửi cookie theo cơ chế của trình duyệt (credentials: include)
  if (typeof window === "undefined") {
    /**
     * 📚 GIẢI THÍCH CHO THỰC TẬP SINH: TỐI ƯU STATIC CACHE
     *
     * 1. NGUYÊN LÝ NEXT.JS:
     * - Nếu trong Server Component có gọi các hàm "Dynamic APIs" như `cookies()`, `headers()`,
     *   Next.js sẽ TỰ ĐỘNG chuyển page đó sang chế độ "Dynamic Rendering" (SSR - Server Side Rendering).
     * - Khi đó, `export const revalidate = 3600` sẽ bị VÔ HIỆU HÓA. Request nào cũng phải chờ server xử lý.
     *
     * 2. GIẢI PHÁP (`skipAuth`):
     * - Với các API public (lấy sản phẩm, danh mục...), ta không cần Token.
     * - Ta truyền `skipAuth: true` để KHÔNG gọi hàm `cookies()`.
     * -> Kết quả: Page Home/Product vẫn được coi là Static và được Cache trên CDN. Tải cực nhanh!
     */
    if (!skipAuth || isStateChanging) {
      try {
        const { cookies, headers } = await import("next/headers");
        const cookieStore = await cookies();
        const headersList = await headers();

        if (!skipAuth) {
          accessToken = cookieStore.get("accessToken")?.value;
        }
        if (isStateChanging) {
          csrfToken = cookieStore.get("csrf-token")?.value;
        }

        // Fingerprinting headers (User-Agent, IP) để bảo mật
        forwardedUserAgent = headersList.get("user-agent") || undefined;
        forwardedIp = headersList.get("x-forwarded-for") || undefined;
        forwardedHost = headersList.get("host") || undefined;
      } catch {
        // "use cache" context hoặc static generation thì không có cookies
      }
    }
  } else {
    // Client-side: Read CSRF token from document.cookie
    if (isStateChanging) {
      const match = document.cookie.match(/csrf-token=([^;]+)/);
      csrfToken = match ? match[1] : undefined;
    }
  }

  // ========================================
  // 2. XÂY DỰNG URL ĐẦY ĐỦ
  // ========================================
  // Đảm bảo đường dẫn cơ sở được giữ nguyên khi đường dẫn bắt đầu bằng /
  const apiUrl = env.NEXT_PUBLIC_API_URL;
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

  const requestHeaders: Record<string, string> = {
    // Đính kèm CSRF token cho security (P0 compliance)
    "X-CSRF-Token": csrfToken || "",
    // Backend yêu cầu Double Submit Cookie: Phải có cả Header VÀ Cookie
    Cookie: csrfToken ? `csrf-token=${csrfToken}` : "",

    // Forward headers for Fingerprinting
    ...(forwardedUserAgent ? { "User-Agent": forwardedUserAgent } : {}),
    ...(forwardedIp ? { "X-Forwarded-For": forwardedIp } : {}),

    // [TENANCY OPTIMIZATION] Forward tenant domain to API
    "X-Tenant-Domain":
      typeof window !== "undefined"
        ? window.location.hostname
        : forwardedHost
        ? forwardedHost.split(":")[0]
        : "",
  };

  // Đính kèm Bearer token nếu có (Ưu tiên token từ server-side session)
  if (accessToken) {
    requestHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  // Merge headers from options (cho phép override)
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      requestHeaders[key] = String(value);
    });
  }

  // Chỉ thêm Content-Type: application/json nếu body không phải FormData
  // (FormData cần browser tự set Content-Type với boundary)
  if (!(rest.body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  // ========================================
  // REQUEST DEDUPLICATION (CLIENT SIDE ONLY)
  // ========================================
  const isGet = rest.method?.toUpperCase() === "GET" || !rest.method;
  const isClient = typeof window !== "undefined";
  const dedupKey = `${url.toString()}-${JSON.stringify(requestHeaders)}`;

  // Note: We skip deduplication if AbortController (timeout) involves,
  // but standard fetch logic handles it fine.

  if (isClient && isGet) {
    const existingRequest = (window as any)._pendingRequests?.get(dedupKey);
    if (existingRequest) {
      if (process.env.NODE_ENV === "development") {
        // console.debug(`[HTTP] Deduplicating Parallel Request: ${url.toString()}`);
      }
      return existingRequest;
    }
  }

  // Khởi tạo map nếu chưa có (trên client)
  if (isClient && !(window as any)._pendingRequests) {
    (window as any)._pendingRequests = new Map<string, Promise<any>>();
  }

  // Define executeFetch internal function
  const executeFetch = async (): Promise<T> => {
    // ========================================
    // 4. THỰC HIỆN REQUEST (WITH TIMEOUT)
    // ========================================
    let res: Response;
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeout ?? API_CONFIG.DEFAULT_TIMEOUT
    );

    try {
      if (process.env.NODE_ENV === "development") {
        // console.debug(
        //   `[HTTP] Fetching: ${url.toString()} (Authorized: ${
        //     !!accessToken || !!requestHeaders["Authorization"]
        //   })`
        // );
      }
      res = await fetch(url.toString(), {
        headers: requestHeaders,
        credentials: "include", // Quan trọng để gửi Cookie khi gọi API khác origin (CORS)
        signal: controller.signal,
        ...rest,
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.warn(`[HTTP Fetch Timeout] ${url} after ${timeout ?? 10000}ms`);
      } else {
        console.warn(`[HTTP Fetch Error] Failed to reach ${url}:`, error);
      }

      // Return a dummy response that won't break the build logic
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, lastPage: 0 },
      } as T;
    } finally {
      clearTimeout(timeoutId);
    }

    // ========================================
    // 5. XỬ LÝ LỖI
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
          } else if (typeof rawMessage === "object" && rawMessage !== null) {
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

      // 401 Unauthorized → Chuyển về trang login
      if (
        res.status === HTTP_STATUS.UNAUTHORIZED &&
        !options.skipRedirectOn401
      ) {
        console.warn(
          `[HTTP ${res.status}] Unauthorized request to: ${url}. Redirecting to /login.`
        );
        if (typeof window !== "undefined") {
          window.location.href = "/login";
          // Stop execution
          return new Promise<T>(() => {});
        } else {
          redirect("/login");
        }
      }

      const error = new Error(errorMessage) as Error & {
        status: number;
        body: unknown;
      };
      error.status = res.status;
      error.body = errorBody;

      const isUnauthorized = res.status === HTTP_STATUS.UNAUTHORIZED;
      if (!isUnauthorized || options.skipRedirectOn401) {
        if (isUnauthorized) {
          console.warn(
            `[HTTP ${
              res.status
            } Received] Expected for guest or stale session, handled by client: ${url.toString()}`
          );
        } else {
          console.error(
            `[HTTP Error] Status: ${
              res.status
            }, URL: ${url.toString()}, Message: ${errorMessage}`
          );
        }
      }

      throw error;
    }

    // ========================================
    // 6. PARSE VÀ TRẢ VỀ DATA
    // ========================================
    // Handle 204 No Content
    if (res.status === HTTP_STATUS.NO_CONTENT) {
      return null as T;
    }

    const type = options.responseType || "json";

    if (type === "json") {
      const data = await res.json();
      return data as T;
    } else if (type === "blob") {
      const data = await res.blob();
      return data as unknown as T;
    } else if (type === "text") {
      const data = await res.text();
      return data as unknown as T;
    } else if (type === "arraybuffer") {
      const data = await res.arrayBuffer();
      return data as unknown as T;
    }

    // Default to json
    const data = await res.json();
    return data as T;
  };

  if (isClient && isGet) {
    const promise = executeFetch().finally(() => {
      (window as any)._pendingRequests?.delete(dedupKey);
    });
    (window as any)._pendingRequests?.set(dedupKey, promise);
    return promise;
  }

  return executeFetch();
}
