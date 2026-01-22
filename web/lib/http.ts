import { redirect } from "next/navigation";
import { API_CONFIG, HTTP_STATUS } from "./constants";
import { env } from "./env";


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
