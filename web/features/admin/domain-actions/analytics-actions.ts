/**
 * =====================================================================
 * ANALYTICS ACTIONS - Xử lý dữ liệu báo cáo
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA AGGREGATION:
 * - Các hàm này gọi API để lấy dữ liệu tổng hợp (Doanh thu, Top sản phẩm...).
 * - Dữ liệu thường được cache nặng (static) hoặc revalidate chậm để giảm tải DB.
 *
 * 2. VISUALIZATION READY:
 * - Dữ liệu trả về (`SalesDataPoint[]`, `TopProduct[]`) được format sẵn
 *   để ném thẳng vào các thư viện biểu đồ như `Recharts` mà không cần xử lý thêm nhiều ở Client. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */
"use server";

import { http } from "@/lib/http";
import {
  AnalyticsStats,
  ApiResponse,
  ActionResult,
  SalesDataPoint,
  TopProduct,
} from "@/types/dtos";
import { wrapServerAction } from "@/lib/safe-action";

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
    () => http<ApiResponse<SalesDataPoint[]>>(`/analytics/sales?days=${range}`),
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
