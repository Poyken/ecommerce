import { redirect } from "next/navigation";
import { API_CONFIG, HTTP_STATUS } from "./constants";
import { env } from "./env";

/**
 * =====================================================================
 * HTTP CLIENT UTILITY
 * =====================================================================
 */

export type FetchOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  next?: NextFetchRequestConfig;
  skipRedirectOn401?: boolean;
  timeout?: number;
  responseType?: "json" | "blob" | "text" | "arraybuffer";
};

let refreshTokenPromise: Promise<boolean> | null = null;

async function fetcher<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers, skipAuth, timeout, ...rest } = options;

  let csrfToken: string | undefined;
  let accessToken: string | undefined;
  let forwardedUserAgent: string | undefined;
  let forwardedIp: string | undefined;
  let forwardedHost: string | undefined;

  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(
    rest.method?.toUpperCase() || "GET"
  );

  if (typeof window === "undefined") {
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

        forwardedUserAgent = headersList.get("user-agent") || undefined;
        forwardedIp = headersList.get("x-forwarded-for") || undefined;
        forwardedHost = headersList.get("host") || undefined;
      } catch {
        // use cache context
      }
    }
  } else {
    if (isStateChanging) {
      const match = document.cookie.match(/csrf-token=([^;]+)/);
      csrfToken = match ? match[1] : undefined;
    }
  }

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

  const requestHeaders: Record<string, string> = {
    "X-CSRF-Token": csrfToken || "",
    Cookie: csrfToken ? `csrf-token=${csrfToken}` : "",
    ...(forwardedUserAgent ? { "User-Agent": forwardedUserAgent } : {}),
    ...(forwardedIp ? { "X-Forwarded-For": forwardedIp } : {}),
  };

  const tenantDomain =
    typeof window !== "undefined"
      ? window.location.hostname
      : forwardedHost
      ? forwardedHost.split(":")[0]
      : undefined;

  if (tenantDomain) {
    requestHeaders["X-Tenant-Domain"] = tenantDomain;
  }

  if (accessToken) {
    requestHeaders["Authorization"] = `Bearer ${accessToken}`;
  }

  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      requestHeaders[key] = String(value);
    });
  }

  if (!(rest.body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const isGet = rest.method?.toUpperCase() === "GET" || !rest.method;
  const isClient = typeof window !== "undefined";
  const dedupKey = `${url.toString()}-${JSON.stringify(requestHeaders)}`;

  if (isClient && isGet) {
    const existingRequest = (window as any)._pendingRequests?.get(dedupKey);
    if (existingRequest) return existingRequest;
  }

  if (isClient && !(window as any)._pendingRequests) {
    (window as any)._pendingRequests = new Map<string, Promise<any>>();
  }

  const executeFetch = async (): Promise<T> => {
    let res: Response;
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      timeout ?? API_CONFIG.DEFAULT_TIMEOUT
    );

    try {
      res = await fetch(url.toString(), {
        headers: requestHeaders,
        credentials: "include",
        signal: controller.signal,
        ...rest,
      });
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.warn(`[HTTP Fetch Timeout] ${url} after ${timeout ?? 10000}ms`);
      } else {
        console.warn(`[HTTP Fetch Error] Failed to reach ${url}:`, error);
      }
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, lastPage: 0 },
      } as T;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      if (
        res.status === HTTP_STATUS.UNAUTHORIZED &&
        !options.skipRedirectOn401
      ) {
        if (typeof window !== "undefined") {
          if (!refreshTokenPromise) {
            refreshTokenPromise = fetch(`${baseUrl}auth/refresh`, {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken || "",
              },
            })
              .then((r) => r.ok)
              .catch(() => false)
              .finally(() => {
                refreshTokenPromise = null;
              });
          }

          const isRefreshed = await refreshTokenPromise;
          if (isRefreshed) {
            return await fetcher<T>(path, {
              ...options,
              skipRedirectOn401: true,
            });
          }
          window.location.href = "/login";
          return new Promise<T>(() => {});
        } else {
          redirect("/login");
        }
      }

      let errorMessage = `API Error: ${res.status} ${res.statusText}`;
      try {
        const errorBody = await res.json();
        if (errorBody && typeof errorBody === "object") {
          const body = errorBody as Record<string, any>;
          errorMessage = body.message || body.error || errorMessage;
          if (Array.isArray(errorMessage))
            errorMessage = errorMessage.join(", ");
        }
      } catch {
        // ignore
      }

      const error = new Error(errorMessage) as any;
      error.status = res.status;
      throw error;
    }

    if (res.status === HTTP_STATUS.NO_CONTENT) return null as T;

    const type = options.responseType || "json";
    if (type === "json") return await res.json();
    if (type === "blob") return (await res.blob()) as any;
    if (type === "text") return (await res.text()) as any;
    if (type === "arraybuffer") return (await res.arrayBuffer()) as any;

    return await res.json();
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

/**
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 * Ta gắn sẵn các method vào hàm http để gọi nặc danh nhanh hơn:
 * VD: http.post("/url", { data }) thay vì http("/url", { method: "POST", body: ... })
 */
export const http = Object.assign(fetcher, {
  get: <T>(path: string, options: FetchOptions = {}) =>
    fetcher<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, data?: any, options: FetchOptions = {}) =>
    fetcher<T>(path, {
      ...options,
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  put: <T>(path: string, data?: any, options: FetchOptions = {}) =>
    fetcher<T>(path, {
      ...options,
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  patch: <T>(path: string, data?: any, options: FetchOptions = {}) =>
    fetcher<T>(path, {
      ...options,
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  delete: <T>(path: string, options: FetchOptions = {}) =>
    fetcher<T>(path, { ...options, method: "DELETE" }),
}) as HttpType;

export type HttpType = {
  <T>(path: string, options?: FetchOptions): Promise<T>;
  get: <T>(path: string, options?: FetchOptions) => Promise<T>;
  post: <T>(path: string, data?: any, options?: FetchOptions) => Promise<T>;
  put: <T>(path: string, data?: any, options?: FetchOptions) => Promise<T>;
  patch: <T>(path: string, data?: any, options?: FetchOptions) => Promise<T>;
  delete: <T>(path: string, options?: FetchOptions) => Promise<T>;
};
