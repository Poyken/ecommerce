/**
 * =====================================================================
 * PLAYWRIGHT CONFIG - Cấu hình End-to-End Testing
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. E2E TESTING LÀ GÌ?
 * - Là test toàn bộ luồng của ứng dụng NHƯ USER THẬT (mở browser, click nút, điền form...).
 * - Khác với Unit Test (test từng function lẻ tẻ).
 *
 * 2. CÁC THIẾT LẬP CHÍNH:
 * - `testDir`: Thư mục chứa file test (`./e2e`).
 * - `webServer`: Tự động bật server Next.js (`npm run start`) trước khi chạy test.
 * - `projects`: Chạy test trên nhiều browser (Chromium, Firefox, Safari) để đảm bảo tương thích.
 * - `trace: 'on-first-retry'`: Nếu test fail, sẽ lưu lại video/trace để debug. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Lưu trữ các cấu hình tĩnh và hằng số hệ thống, giúp dễ dàng thay đổi giá trị tại một nơi.

 * =====================================================================
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
