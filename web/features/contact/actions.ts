"use server";

import { actionClient } from "@/lib/safe-action";
import { contactSchema } from "./schemas";
import { getErrorMessage } from "@/lib/error-utils";



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
