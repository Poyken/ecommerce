/**
 * =====================================================================
 * BARREL FILE - Export tập trung cho Hooks
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PATTERN NAY LÀ GÌ?
 * - Gọi là "Barrel Pattern" (Thùng chứa).
 * - Thay vì import lẻ tẻ: `import { useA } from './hooks/useA'`, `import { useB } from './hooks/useB'`...
 * - Ta chỉ cần: `import { useA, useB } from '@/lib/hooks'`.
 *
 * 2. LỢI ÍCH:
 * - Code gọn gàng hơn (1 dòng import thay vì 10 dòng).
 * - Dễ dàng refactor (di chuyển file con mà không ảnh hưởng nơi import).
 * =====================================================================
 */
export * from "./use-debounce";
export * from "./use-admin-table";
