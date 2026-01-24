
"use server";

import { protectedActionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { superAdminInvoiceService } from "../services/super-admin-invoice.service";

const getInvoicesSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
});

export const getInvoicesAction = protectedActionClient
  .schema(getInvoicesSchema)
  .action(async ({ parsedInput: { page, limit } }) => {
    return superAdminInvoiceService.getInvoices(page, limit);
  });

const updateStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
});

export const updateInvoiceStatusAction = protectedActionClient
  .schema(updateStatusSchema)
  .action(async ({ parsedInput: { id, status } }) => {
    const res = await superAdminInvoiceService.updateInvoiceStatus(id, status);
    revalidatePath("/super-admin/invoices");
    return res;
  });
