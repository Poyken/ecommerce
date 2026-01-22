
"use server";

import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import { superAdminPlanService } from "../services/super-admin-plan.service";
import { ActionResult } from "@/types/dtos";
import { Plan, PlanInput } from "@/types/feature-types/admin.types";

export async function getPlansAction(): Promise<ActionResult<Plan[]>> {
  return wrapServerAction(
    () => superAdminPlanService.getPlans(),
    "Failed to fetch plans"
  );
}

export async function createPlanAction(
  data: PlanInput
): Promise<ActionResult<Plan>> {
  return wrapServerAction(async () => {
    const res = await superAdminPlanService.createPlan(data);
    REVALIDATE.path("/super-admin/plans");
    return res.data;
  }, "Failed to create plan");
}

export async function updatePlanAction({
  id,
  data,
}: {
  id: string;
  data: Partial<PlanInput>;
}): Promise<ActionResult<Plan>> {
  return wrapServerAction(async () => {
    const res = await superAdminPlanService.updatePlan(id, data);
    REVALIDATE.path("/super-admin/plans");
    return res.data;
  }, "Failed to update plan");
}

export async function deletePlanAction({
  id,
}: {
  id: string;
}): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await superAdminPlanService.deletePlan(id);
    REVALIDATE.path("/super-admin/plans");
  }, "Failed to delete plan");
}
