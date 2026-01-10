/**
 * =====================================================================
 * LIB INDEX - Central Export Point
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BARREL EXPORTS:
 * - Thay vì import từ nhiều file khác nhau, ta export từ một điểm duy nhất.
 * - Giúp code gọn gàng: `import { cn, formatVND } from "@/lib"`
 *
 * 2. TREE SHAKING:
 * - Bundler (webpack, turbopack) sẽ tự động loại bỏ code không dùng.
 * =====================================================================
 */

"use client"; // This file should be marked as client if it exports stateful things,
// but mostly it's utils. Next.js handles it.

// Utils chung
export { cn } from "./utils";

// Format utilities
export * from "./format";

// Constants
export * from "./constants";

// Basic types & API types
export * from "./types";

// Validation schemas
export * from "./schemas";

// --- NOTE ON SPECIFIC IMPORTS ---
// Hooks: Import from "@/lib/hooks"
// HTTP: Import from "@/lib/http"
// Safe Actions: Import from "@/lib/safe-action"
// Animations: Import from "@/lib/animations"
