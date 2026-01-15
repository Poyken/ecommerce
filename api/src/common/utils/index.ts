// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// UTILS BARREL FILE - TỔNG HỢP CÔNG CỤ TIỆN ÍCH
// =================================================================================================
//
// Nơi tập trung các hàm tiện ích dùng chung cho toàn bộ API service.
// Các utils này thường độc lập, không phụ thuộc vào business logic (pure functions).
//
// DANH SÁCH UTILS:
// - circuit-breaker: Xử lý ngắt mạch khi gọi service bên ngoài lỗi.
// - fingerprint: Tạo định danh duy nhất cho thiết bị/session.
// - masking: Che giấu dữ liệu nhạy cảm (email, sđt) trong logs.
// - string: Các hàm xử lý chuỗi cơ bản.
// =================================================================================================
/**
 * =====================================================================
 * UTILS BARREL FILE - Export all utility functions *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Cung cấp các hàm tiện ích dùng chung, giúp code gọn gàng và tái sử dụng hiệu quả.

 * =====================================================================
 */

export * from './circuit-breaker';
export * from './fingerprint';
export * from './masking';
export * from './string';
