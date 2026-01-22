import { getAdminReturnsAction } from "@/features/admin/actions";
import { ReturnsClient } from "./returns-client";
import { ReturnStatus } from "@/types/models";

/**
 * =====================================================================
 * ADMIN RETURNS PAGE - Quản lý Trả hàng (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RMA FLOW (Vòng đời trả hàng):
 * - Theo dõi các yêu cầu từ PENDING đến REFUNDED/REJECTED.
 * - Cho phép lọc theo trạng thái để xử lý nhanh.
 *
 * 2. DATA AGGREGATION:
 * - `getReturnCounts` đếm số lượng yêu cầu ở mỗi trạng thái để hiển thị trên các Tabs.
 *
 * 3. SERVER-SIDE FETCHING:
 * - Sử dụng Server Actions để lấy dữ liệu trực tiếp, tối ưu SEO và tốc độ load trang đầu.
 * =====================================================================
 */

async function getReturnCounts() {
  const statuses: ReturnStatus[] = [
    "PENDING",
    "APPROVED",
    "WAITING_FOR_RETURN",
    "IN_TRANSIT",
    "RECEIVED",
    "INSPECTING",
    "REFUNDED",
    "REJECTED",
    "CANCELLED",
  ];

  try {
    // Fetch counts in parallel
    const results = await Promise.all(
      statuses.map((status) =>
        getAdminReturnsAction({ page: 1, limit: 1, search: "", status })
      )
    );

    const counts: Record<string, number> = {};

    // Total count
    const allResult = await getAdminReturnsAction({ page: 1, limit: 1 });
    if ("data" in allResult && allResult.data) {
      counts.total = allResult.meta?.total || 0;
    }

    results.forEach((res, index) => {
      if ("data" in res && res.data) {
        counts[statuses[index]] = res.meta?.total || 0;
      } else {
        counts[statuses[index]] = 0;
      }
    });

    return counts;
  } catch {
    return { total: 0 };
  }
}

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const search = params.search || "";
  const status = params.status || "all";

  const [returnsResult, counts] = await Promise.all([
    getAdminReturnsAction({ page, limit, search, status }),
    getReturnCounts(),
  ]);

  if (!("data" in returnsResult) || !returnsResult.data) {
    return (
      <div className="text-red-600 p-4 font-medium bg-red-50 rounded-lg">
        Error: {returnsResult.error || "Failed to load returns"}
      </div>
    );
  }

  return (
    <ReturnsClient
      returns={returnsResult.data || []}
      total={returnsResult.meta?.total || 0}
      page={page}
      limit={limit}
      counts={counts}
      currentStatus={status}
    />
  );
}
