import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import "server-only";
import { env } from "./env";

/**
 * =====================================================================
 * SERVER-SIDE HTTP CLIENT
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER-ONLY:
 * - Chỉ dành cho Server Components và Server Actions.
 * - "server-only" package sẽ báo lỗi nếu file này được import vào Client Component.
 *
 * 2. AUTOMATIC AUTH:
 * - Tự động đọc accessToken từ cookies.
 * - Tự động gắn CSRF token cho mutations.
 * - Tự động forward User-Agent và IP cho fingerprinting.
 *
 * 3. ERROR HANDLING:
 * - Tự động redirect về /login khi 401 Unauthorized.
 * - Parse error message từ API response.
 * - Logging để dễ debug.
 * =====================================================================
 */

type ServerFetchOptions = RequestInit & {
  /** Query parameters - will be appended to URL */
  params?: Record<string, string | number | boolean | undefined>;
  /** Skip automatic auth token injection */
  skipAuth?: boolean;
  /** Next.js caching configuration */
  next?: NextFetchRequestConfig;
  /** Skip redirect to login on 401 */
  skipRedirectOn401?: boolean;
};

/**
 * Server-side HTTP client for API calls from Server Components/Actions
 *
 * @template T - Expected response data type
 * @param path - API endpoint path (e.g., "/products", "/cart")
 * @param options - Fetch options
 * @returns Parsed JSON response
 * @throws Error if request fails (with API error message)
 *
 * @example
 * // In Server Component
 * const products = await httpServer<ApiResponse<Product[]>>("/products");
 *
 * @example
 * // In Server Action
 * "use server";
 * async function addToCart(skuId: string) {
 *   return httpServer("/cart", {
 *     method: "POST",
 *     body: JSON.stringify({ skuId, quantity: 1 }),
 *   });
 * }
 */
export async function httpServer<T>(
  path: string,
  options: ServerFetchOptions = {}
): Promise<T> {
  const { params, headers: customHeaders, skipAuth, ...rest } = options;

  // ========================================
  // 1. EXTRACT SERVER CONTEXT
  // ========================================
  let csrfToken: string | undefined;
  let accessToken: string | undefined;
  let forwardedUserAgent: string | undefined;
  let forwardedIp: string | undefined;

  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(
    rest.method?.toUpperCase() || "GET"
  );

  // Always read from server context (cookies/headers)
  if (!skipAuth || isStateChanging) {
    const cookieStore = await cookies();
    const headersList = await headers();

    if (!skipAuth) {
      accessToken = cookieStore.get("accessToken")?.value;
    }

    if (isStateChanging) {
      csrfToken = cookieStore.get("csrf-token")?.value;
    }

    forwardedUserAgent = headersList.get("user-agent") || undefined;
    forwardedIp = headersList.get("x-forwarded-for") || undefined;
  }

  // ========================================
  // 2. BUILD URL
  // ========================================
  const apiUrl = env.API_URL || env.NEXT_PUBLIC_API_URL;
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
  // 3. BUILD HEADERS
  // ========================================
  const requestHeaders: Record<string, string> = {
    Authorization: accessToken ? `Bearer ${accessToken}` : "",
    "X-CSRF-Token": csrfToken || "",
    Cookie: csrfToken ? `csrf-token=${csrfToken}` : "",
    ...(forwardedUserAgent ? { "User-Agent": forwardedUserAgent } : {}),
    ...(forwardedIp ? { "X-Forwarded-For": forwardedIp } : {}),
    ...(customHeaders as Record<string, string>),
  };

  if (!(rest.body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  // ========================================
  // 4. EXECUTE REQUEST
  // ========================================
  console.log(
    `[HTTP Server] ${
      rest.method || "GET"
    } ${url.toString()} (Auth: ${!!accessToken})`
  );

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: requestHeaders,
      ...rest,
    });
  } catch (error) {
    console.error(`[HTTP Server] Network error:`, error);
    throw new Error(
      `Failed to reach API: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  // ========================================
  // 5. HANDLE ERRORS
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

    // Redirect on 401 Unauthorized or 404 User Not Found
    const isUserNotFound = res.status === 404;
    if ((res.status === 401 || isUserNotFound) && !options.skipRedirectOn401) {
      console.warn(
        `[HTTP Server] ${
          isUserNotFound ? "User Not Found" : "Unauthorized"
        } - Redirecting to /login`
      );
      redirect("/login");
    }

    const error = new Error(errorMessage) as Error & {
      status: number;
      body: unknown;
    };
    error.status = res.status;
    error.body = errorBody;

    console.error(
      `[HTTP Server Error] ${res.status} ${url.toString()}: ${errorMessage}`
    );

    throw error;
  }

  // ========================================
  // 6. PARSE AND RETURN
  // ========================================
  if (res.status === 204) {
    return null as T;
  }

  const data = await res.json();
  return data as T;
}
