"use server";

import { http } from "@/lib/http";
import {
  AnalyticsStats,
  ApiResponse,
  ActionResult,
  SalesDataPoint,
  TopProduct,
} from "@/types/dtos";
import { wrapServerAction } from "@/lib/server-action-wrapper";

/**
 * =====================================================================
 * ANALYTICS & DASHBOARD ACTIONS - Thống kê & Báo cáo
 * =====================================================================
 */

export async function getAnalyticsStatsAction(): Promise<
  ActionResult<AnalyticsStats>
> {
  return wrapServerAction(
    () => http<ApiResponse<AnalyticsStats>>("/analytics/stats"),
    "Failed to fetch analytics stats"
  );
}

export async function getSalesDataAction(
  range: string
): Promise<ActionResult<SalesDataPoint[]>> {
  return wrapServerAction(
    () =>
      http<ApiResponse<SalesDataPoint[]>>(`/analytics/sales?range=${range}`),
    "Failed to fetch sales data"
  );
}

export async function getTopProductsAction(): Promise<
  ActionResult<TopProduct[]>
> {
  return wrapServerAction(
    () => http<ApiResponse<TopProduct[]>>("/analytics/top-products"),
    "Failed to fetch top products"
  );
}

export async function getBlogStatsAction(): Promise<ActionResult<any>> {
  return wrapServerAction(
    () => http<ApiResponse<any>>("/blog/stats"),
    "Failed to fetch blog stats"
  );
}
