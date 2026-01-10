"use server";

import { protectedActionClient } from "@/lib/safe-action";
import { http } from "@/lib/http";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const getInvoicesSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
});

export const getInvoicesAction = protectedActionClient
  .schema(getInvoicesSchema)
  .action(async ({ parsedInput: { page, limit } }) => {
    return http(`/invoices?page=${page}&limit=${limit}`);
  });

const updateStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
});

export const updateInvoiceStatusAction = protectedActionClient
  .schema(updateStatusSchema)
  .action(async ({ parsedInput: { id, status } }) => {
    const res = await http(`/invoices/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    revalidatePath("/super-admin/invoices");
    return res;
  });
