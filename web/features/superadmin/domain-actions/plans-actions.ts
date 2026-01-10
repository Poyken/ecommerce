"use server";

import { protectedActionClient } from "@/lib/safe-action";
import { http } from "@/lib/http";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const getPlansAction = protectedActionClient.action(async () => {
  return http("/plans");
});

export const createPlanAction = protectedActionClient
  .schema(z.any())
  .action(async ({ parsedInput: data }) => {
    const res = await http("/plans", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/super-admin/plans");
    return res;
  });

export const updatePlanAction = protectedActionClient
  .schema(
    z.object({
      id: z.string(),
      data: z.any(),
    })
  )
  .action(async ({ parsedInput: { id, data } }) => {
    const res = await http(`/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    revalidatePath("/super-admin/plans");
    return res;
  });

export const deletePlanAction = protectedActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id } }) => {
    const res = await http(`/plans/${id}`, {
      method: "DELETE",
    });
    revalidatePath("/super-admin/plans");
    return res;
  });
