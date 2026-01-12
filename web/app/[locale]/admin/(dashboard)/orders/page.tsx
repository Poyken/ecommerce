import { getOrdersAction } from "@/features/admin/actions";
import { OrdersClient } from "./orders-client";

/**
 * =====================================================================
 * ADMIN ORDERS PAGE - Quản lý đơn hàng (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUẢN LÝ LUỒNG ĐƠN HÀNG (Order Management):
 * - Đây là một trong những trang quan trọng nhất của hệ thống thương mại điện tử.
 * - Cho phép theo dõi hành trình đơn hàng từ lúc PENDING (Chờ xử lý) cho đến khi DELIVERED (Đã giao) hoặc CANCELLED (Đã hủy).
 *
 * 2. SERVER-SIDE FILTERING & COUNTS:
 * - Để tối ưu, việc lọc theo trạng thái (`status`) được thực hiện ngay tại Server thông qua `getOrdersAction`.
 * - `getOrderCounts` (dòng 21) sử dụng `Promise.all` để đếm số lượng đơn hàng ở mỗi trạng thái, giúp hiển thị các Badge/Tabs thống kê chính xác.
 *
 * 3. PHÂN TRANG (Pagination):
 * - Chỉ load một lượng nhỏ đơn hàng mỗi trang để đảm bảo tốc độ phản hồi nhanh, ngay cả khi database có hàng triệu bản ghi. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

async function getOrderCounts() {
  const statuses = [
    "PENDING",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  try {
    // Fetch counts in parallel
    const results = await Promise.all(
      statuses.map((status) =>
        getOrdersAction({ page: 1, limit: 1, search: "", status })
      )
    );

    const counts: Record<string, number> = {};

    // Total count (fetch all)
    const allResult = await getOrdersAction({ page: 1, limit: 1 });
    if ("data" in allResult) {
      counts.total = allResult.meta?.total || 0;
    }

    results.forEach((res, index) => {
      if ("data" in res) {
        counts[statuses[index]] = res.meta?.total || 0;
      } else {
        counts[statuses[index]] = 0;
      }
    });

    return counts;
  } catch {
    // console.error("Error fetching order counts");
    return { total: 0 };
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const search = params.search || "";
  const status = params.status || "all";

  const [ordersResult, counts] = await Promise.all([
    getOrdersAction({ page, limit, search, status }),
    getOrderCounts(),
  ]);

  if (!("data" in ordersResult)) {
    return (
      <div className="text-red-600">Error: {(ordersResult as any).error}</div>
    );
  }

  return (
    <OrdersClient
      orders={ordersResult.data || []}
      total={ordersResult.meta?.total || 0}
      page={page}
      limit={limit}
      counts={counts}
      currentStatus={status}
    />
  );
}
