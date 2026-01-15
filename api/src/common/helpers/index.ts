// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// HELPERS BARREL FILE
// =================================================================================================
//
// Mục đích: Gom tất cả các helper functions từ các file con (query, response...) lại thành một
// điểm import duy nhất. Giúp code gọn gàng hơn.
// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// HELPERS BARREL FILE
// =================================================================================================
//
// Mục đích: Gom tất cả các helper functions từ các file con (query, response...) lại thành một
// điểm import duy nhất. Giúp code gọn gàng hơn.
//
// Ví dụ: `import { buildQuery, successResponse } from '@/common/helpers';`
// =================================================================================================
/**
 * Barrel export cho tất cả helpers. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Simplify Imports: Giúp các file khác chỉ cần `import ... from '@/common/helpers'` thay vì phải nhớ đường dẫn cụ thể của từng file con.
 * - Code Organization: Gom nhóm các utility function liên quan lại với nhau để dễ quản lý.
 */
export * from './query';
