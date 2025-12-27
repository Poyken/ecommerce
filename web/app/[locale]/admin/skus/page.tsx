import { getSkusAction } from "@/features/admin/actions";
import { SkusClient } from "./skus-client";

/**
 * =====================================================================
 * ADMIN SKUS PAGE - Quản lý biến thể sản phẩm (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SKU LÀ GÌ? (Stock Keeping Unit):
 * - SKU là các biến thể cụ thể của sản phẩm. Ví dụ: "Áo thun" là Product, nhưng "Áo thun - Đỏ - Size M" là một SKU.
 * - Mỗi SKU có giá riêng, tồn kho riêng, và mã SKU riêng để quản lý.
 *
 * 2. SERVER-SIDE FILTERING & COUNTS:
 * - `getSkuCounts` fetch song song để đếm số lượng SKU theo từng trạng thái (Active, Inactive, Low Stock).
 * - Hỗ trợ lọc theo trạng thái và cảnh báo tồn kho thấp (`stockLimit`).
 *
 * 3. INVENTORY MANAGEMENT:
 * - Trang này rất quan trọng cho việc quản lý kho hàng, giúp Admin biết sản phẩm nào sắp hết để nhập thêm.
 * =====================================================================
 */

async function getSkuCounts() {
  try {
    const [all, active, inactive, lowStock] = await Promise.all([
      getSkusAction(1, 1),
      getSkusAction(1, 1, "ACTIVE"),
      getSkusAction(1, 1, "INACTIVE"),
      getSkusAction(1, 1, undefined, undefined, 10),
    ]);

    return {
      total: "data" in all ? all.meta?.total || 0 : 0,
      active: "data" in active ? active.meta?.total || 0 : 0,
      inactive: "data" in inactive ? inactive.meta?.total || 0 : 0,
      lowStock: "data" in lowStock ? lowStock.meta?.total || 0 : 0,
    };
  } catch (error) {
    // this.logger.error("Error fetching SKU counts:", error);
    return { total: 0, active: 0, inactive: 0, lowStock: 0 };
  }
}

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

  const [result, counts] = await Promise.all([
    getSkusAction(page, limit, status, search, stockLimit),
    getSkuCounts(),
  ]);

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
      counts={counts}
    />
  );
}
