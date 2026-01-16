import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "form.errors.name"),
  email: z.string().email("form.errors.emailInvalid"),
  subject: z.string().min(1, "form.errors.subject"),
  message: z.string().min(1, "form.errors.message"),
});

export type ContactInput = z.infer<typeof contactSchema>;
