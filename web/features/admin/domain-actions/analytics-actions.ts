
"use server";

import {
  AnalyticsStats,
  ActionResult,
  SalesDataPoint,
  TopProduct,
} from "@/types/dtos";
import { wrapServerAction } from "@/lib/safe-action";

import { adminAnalyticsService } from "../services/admin-analytics.service";

/**
 * =====================================================================
 * ANALYTICS & DASHBOARD ACTIONS - Thống kê & Báo cáo
 * =====================================================================
 */

export async function getAnalyticsStatsAction(): Promise<
  ActionResult<AnalyticsStats>
> {
  return wrapServerAction(
    () => adminAnalyticsService.getStats(),
    "Failed to fetch analytics stats"
  );
}

export async function getSalesDataAction(
  range: string
): Promise<ActionResult<SalesDataPoint[]>> {
  return wrapServerAction(
    () => adminAnalyticsService.getSalesData(range),
    "Failed to fetch sales data"
  );
}

export async function getTopProductsAction(): Promise<
  ActionResult<TopProduct[]>
> {
  return wrapServerAction(
    () => adminAnalyticsService.getTopProducts(),
    "Failed to fetch top products"
  );
}

export async function getBlogStatsAction(): Promise<
  ActionResult<{
    totalPosts: number;
    totalViews: number;
    avgReadTime: number;
  }>
> {
  return wrapServerAction(
    () => adminAnalyticsService.getBlogStats(),
    "Failed to fetch blog stats"
  );
}
