"use server";

import { wrapServerAction } from "@/lib/server-action-wrapper";
import { http } from "@/lib/http";
import { revalidatePath } from "next/cache";

export const getPlansAction = wrapServerAction(async () => {
  return http.get("/plans");
});

export const createPlanAction = wrapServerAction(async (data: any) => {
  const res = await http.post("/plans", data);
  revalidatePath("/super-admin/plans");
  return res;
});

export const updatePlanAction = wrapServerAction(
  async (id: string, data: any) => {
    const res = await http.patch(`/plans/${id}`, data);
    revalidatePath("/super-admin/plans");
    return res;
  }
);

export const deletePlanAction = wrapServerAction(async (id: string) => {
  const res = await http.delete(`/plans/${id}`);
  revalidatePath("/super-admin/plans");
  return res;
});
