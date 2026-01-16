import { http } from "@/lib/http";
import { z } from "zod";
import { contactSchema } from "../schemas";

/**
 * =====================================================================
 * CONTACT SERVICE - Domain logic for contact
 * =====================================================================
 */

export const contactService = {
  sendMessage: async (data: z.infer<typeof contactSchema>) => {
    return http.post("/api/v1/contact", data);
  },
};
