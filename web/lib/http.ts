import { redirect } from "next/navigation";
import { API_CONFIG, HTTP_STATUS } from "./constants";
import { env } from "./env";

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
  skipRedirectOn401?: boolean;
  responseType?: "json" | "blob" | "arraybuffer" | "text";
}

const fetcher = async <T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> => {
  const { params, skipAuth, responseType = "json", ...init } = options;

  const baseUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
  // If path is absolute, use it. Otherwise prepend baseUrl.
  const urlString = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  const url = new URL(urlString);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url.toString(), {
    ...init,
    headers,
  });

  if (!response.ok) {
    // Attempt to parse error JSON
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Ignore JSON parse error, use status text
      errorMessage = response.statusText;
    }
    
    // Throw error or handle specific status codes
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  if (response.status === HTTP_STATUS.NO_CONTENT) {
    return {} as T;
  }

  if (responseType === "blob") return response.blob() as unknown as T;
  if (responseType === "arraybuffer") return response.arrayBuffer() as unknown as T;
  if (responseType === "text") return response.text() as unknown as T;

  return response.json();
};

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
