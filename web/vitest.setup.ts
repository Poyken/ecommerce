/**
 * =====================================================================
 * VITEST SETUP - Cấu hình môi trường Test Unit/Integration
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 * - File này chạy TRƯỚC khi các test cases được thực thi.
 * - Dùng để thiết lập môi trường giả lập (Polyfills, Mock globals).
 *
 * 2. `@testing-library/jest-dom`:
 * - Thêm các custom matchers vào Vitest/Jest (VD: `toBeInTheDocument()`, `toHaveClass()`).
 * - Giúp viết test cho React Components dễ đọc và tự nhiên hơn.
 * =====================================================================
 */
import "@testing-library/jest-dom";
