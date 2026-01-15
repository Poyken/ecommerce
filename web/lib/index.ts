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
 * - Bundler (webpack, turbopack) sẽ tự động loại bỏ code không dùng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Fast Development: Giúp Developer không phải mất thời gian tìm kiếm function trong hàng chục file lẻ, chỉ cần `import from "@/lib"`.
 * - DX (Developer Experience): Tận dụng tối đa sức mạnh của Auto-import trong IDE, giúp tốc độ gõ code tăng lên đáng kể.
 *
 * =====================================================================
 */

// Utils chung
export * from "./utils";

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
// TypedNavigation: Import from "@/lib/typed-navigation"
//   - TypedLink, useTypedRouter, appRoutes for type-safe routing
