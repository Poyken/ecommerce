/**
 * =====================================================================
 * LIB INDEX - Central Export Point
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BARREL EXPORTS:
 * - Thay vì import từ nhiều file khác nhau, ta export từ một điểm duy nhất.
 * - Giúp code gọn gàng: `import { cn, formatVND, useDebounce } from "@/lib"`
 *
 * 2. TREE SHAKING:
 * - Bundler (webpack, turbopack) sẽ tự động loại bỏ code không dùng.
 * - Nên việc export nhiều không ảnh hưởng đến bundle size.
 * =====================================================================
 */

// Utils chung
export { cn } from "./utils";

// Format utilities
export * from "./format";

// Constants
export * from "./constants";

// Result pattern cho error handling
export * from "./result";

// Basic types & API types
export * from "./types";

// API helpers
export * from "./api-helpers";

// Custom hooks (chỉ dùng trong client components)
// Không export ở đây vì hooks cần "use client"
// Import trực tiếp: import { useDebounce } from "@/lib/hooks"

// HTTP client
// Import trực tiếp: import { http } from "@/lib/http"

// Cache utilities
// Import trực tiếp: import { createCachedFunction } from "@/lib/cache"
