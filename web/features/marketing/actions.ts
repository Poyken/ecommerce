"use server";

import { actionClient } from "@/lib/safe-action";
import { newsletterSchema } from "./schemas";
import { getErrorMessage } from "@/lib/error-utils";

/**
 * =====================================================================
 * MARKETING ACTIONS - Các action liên quan đến marketing
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER ACTIONS:
 * - Chạy trực tiếp trên server, an toàn hơn và giảm logic ở client.
 * - Sử dụng `actionClient` để wrap các xử lý lỗi và validation tự động.
 *
 * 2. API INTEGRATION:
 * - Sử dụng `http` wrapper đã cấu hình sẵn để gọi API backend.
 *
 * =====================================================================
 */

import { marketingService } from "./services/marketing.service";

export const subscribeNewsletter = actionClient
  .schema(newsletterSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Gọi API backend thông qua service
      await marketingService.subscribeNewsletter(parsedInput.email);

      return {
        success: true,
        message: "successDesc",
      };
    } catch (error) {
      console.error("[NEWSLETTER_SUBSCRIBE_ERROR]", error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  });
