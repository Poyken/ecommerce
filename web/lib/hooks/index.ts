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
 * - Dễ dàng refactor (di chuyển file con mà không ảnh hưởng nơi import). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Modular Logic: Tách biệt logic xử lý (vd: debounce, fetch data) ra khỏi UI, giúp component chỉ tập trung vào việc render.
 * - Single Entry Point: Giúp Team dev dễ dàng nắm bắt toàn bộ các "siêu năng lực" (hooks) mà dự án đang hỗ trợ một cách nhanh nhất.

 * =====================================================================
 */
export * from "./use-debounce";
export * from "./use-admin-table";
