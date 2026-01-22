"use server";

import { actionClient } from "@/lib/safe-action";
import { newsletterSchema } from "./schemas";
import { getErrorMessage } from "@/lib/error-utils";



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
