

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Kết hợp và merge các class names một cách thông minh.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

export function formatNumber(amount: number, locale = "vi-VN"): string {
  const value =
    isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
  return new Intl.NumberFormat(locale).format(value);
}

export function formatCurrency(
  amount: number,
  locale = "vi-VN",
  currency = "VND",
  options: Intl.NumberFormatOptions = {},
): string {
  const value =
    isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...options,
  }).format(value);
}

export function formatVND(
  amount: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return formatCurrency(amount, "vi-VN", "VND", options);
}

// ============================================================================
// DATE/TIME FORMATTING
// ============================================================================

export function formatDate(date: Date | string | number): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | number): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// ============================================================================
// TEXT & MISC
// ============================================================================

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================================
// API HELPERS
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}

/**
 * Normalize pagination parameters for API requests.
 * Handles both object-style and positional arguments.
 */
export function normalizePaginationParams(
  paramsOrPage?: number | PaginationParams,
  limit?: number,
  search?: string,
): Record<string, string | number | boolean | undefined> {
  // If first argument is an object, use its properties
  if (typeof paramsOrPage === "object" && paramsOrPage !== null) {
    return {
      page: paramsOrPage.page || 1,
      limit: paramsOrPage.limit || 10,
      search: paramsOrPage.search || undefined,
      ...paramsOrPage,
    };
  }

  // Otherwise, treat as positional arguments
  return {
    page: paramsOrPage || 1,
    limit: limit || 10,
    search: search || undefined,
  };
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error)
    return String((error as any).message);
  return "Unknown error";
};
