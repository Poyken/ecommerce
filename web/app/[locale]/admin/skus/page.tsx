import { getSkusAction } from "@/actions/admin";
import { SkusClient } from "./skus-client";

/**
 * =====================================================================
 * ADMIN SKUS PAGE - Quản lý biến thể sản phẩm (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SKU (Stock Keeping Unit):
 * - Đây là đơn vị quản lý tồn kho chi tiết nhất. Một sản phẩm có thể có nhiều SKU (VD: iPhone 15 Pro - Màu Xanh - 256GB).
 * - Trang này giúp admin theo dõi chính xác số lượng tồn kho của từng biến thể.
 *
 * 2. ADVANCED FILTERING:
 * - Hỗ trợ lọc theo `status` (ACTIVE/INACTIVE), `search` (mã SKU) và `stockLimit` (cảnh báo hàng sắp hết).
 * - Toàn bộ trạng thái lọc được lưu trên URL để dễ dàng quản lý.
 *
 * 3. SERVER-SIDE DATA FETCHING:
 * - Sử dụng `getSkusAction` để lấy dữ liệu từ server, đảm bảo hiệu năng tốt nhất cho bảng dữ liệu lớn.
 * =====================================================================
 */

export default async function SKUsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
    stockLimit?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const status = params.status === "ALL" ? undefined : params.status;
  const search = params.search || "";
  const stockLimit = params.stockLimit
    ? parseInt(params.stockLimit)
    : undefined;

  const result = await getSkusAction(page, limit, status, search, stockLimit);

  if (!("data" in result)) {
    return (
      <div className="p-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
          <h2 className="font-bold mb-2">Error loading SKUs</h2>
          <p>{(result as any).error}</p>
        </div>
      </div>
    );
  }

  return (
    <SkusClient
      skus={result.data || []}
      total={result.meta?.total || 0}
      page={page}
      limit={limit}
    />
  );
}
