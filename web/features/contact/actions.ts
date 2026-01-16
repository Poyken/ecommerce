"use server";

import { actionClient } from "@/lib/safe-action";
import { contactSchema } from "./schemas";
import { getErrorMessage } from "@/lib/error-utils";

/**
 * =====================================================================
 * CONTACT ACTIONS - Các action liên quan đến liên hệ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER ACTIONS:
 * - Đảm bảo xử lý logic gửi tin nhắn liên hệ an toàn phía server.
 *
 * =====================================================================
 */

import { contactService } from "./services/contact.service";

export const sendMessage = actionClient
  .schema(contactSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Gọi API backend (giả định endpoint /api/v1/contact)
      await contactService.sendMessage(parsedInput);

      return {
        success: true,
      };
    } catch (error) {
      console.error("[CONTACT_SEND_ERROR]", error);
      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  });
