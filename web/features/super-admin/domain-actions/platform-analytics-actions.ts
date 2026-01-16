"use server";

import { superAdminAnalyticsService } from "../services/super-admin-analytics.service";
import { ActionResult, SuperAdminAnalyticsStats } from "@/types/dtos";
import { wrapServerAction } from "@/lib/safe-action";

/**
 * =====================================================================
 * PLATFORM ANALYTICS ACTIONS - Thống kê toàn hệ thống (Super Admin)
 * =====================================================================
 */

export async function getPlatformStatsAction(): Promise<
  ActionResult<SuperAdminAnalyticsStats>
> {
  return wrapServerAction(
    () => superAdminAnalyticsService.getPlatformStats(),
    "Failed to fetch platform analytics stats"
  );
}
