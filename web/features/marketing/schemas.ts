import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.string().email("invalidEmail"),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
