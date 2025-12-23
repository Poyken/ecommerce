/**
 * =====================================================================
 * ENVIRONMENT VARIABLES - Biến môi trường
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TẠI SAO CẦN FILE NÀY?
 * - Thay vì dùng trực tiếp `process.env.API_URL` rải rác khắp nơi, ta tập trung vào đây.
 * - Giúp autocomplete (IntelliSense) hoạt động tốt hơn.
 * - Đảm bảo Type Safety (không bao giờ bị undefined bất ngờ).
 *
 * 2. ZOD VALIDATION (RUNTIME CHECK):
 * - Nếu quên set biến môi trường trong `.env`, ứng dụng sẽ CRASH ngay khi khởi động
 *   với thông báo lỗi rõ ràng, thay vì chạy sai logic ngầm.
 * - Validate định dạng (URL, Email, Min/Max length...).
 *
 * 3. CLIENT VS SERVER:
 * - `NEXT_PUBLIC_`: Biến này sẽ được bundle vào code JS gửi xuống trình duyệt.
 * - Không có prefix: Chỉ tồn tại trên server (bảo mật API Key, Database URL...).
 * =====================================================================
 */

import { z } from "zod";

/**
 * Schema validate cho environment variables.
 * Định nghĩa kiểu dữ liệu và giá trị mặc định cho từng biến.
 */
const envSchema = z.object({
  /**
   * URL của API backend, accessible từ browser.
   * ⚠️ Prefix NEXT_PUBLIC_ cho phép sử dụng từ Client Components.
   */
  NEXT_PUBLIC_API_URL: z.url().default("http://127.0.0.1:8080/api/v1"),

  /**
   * URL của API backend cho server-side requests (optional).
   * Dùng trong Docker khi server container gọi API container qua internal network.
   * Nếu không set, sẽ fallback về NEXT_PUBLIC_API_URL trong http.ts.
   */
  API_URL: z.url().optional(),
});

/**
 * Environment variables đã được validate.
 * Import và sử dụng thay vì truy cập trực tiếp process.env.
 *
 * @example
 * import { env } from "@/lib/env";
 *
 * const apiUrl = env.NEXT_PUBLIC_API_URL;
 * // → "http://127.0.0.1:8080/api/v1" (hoặc giá trị trong .env)
 */
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const formattedApiUrl = rawApiUrl.includes("/api/v1")
  ? rawApiUrl
  : `${rawApiUrl}/api/v1`;

const rawServerApiUrl =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";
const formattedServerApiUrl = rawServerApiUrl.includes("/api/v1")
  ? rawServerApiUrl
  : `${rawServerApiUrl}/api/v1`;

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: formattedApiUrl,
  API_URL: formattedServerApiUrl,
});
