import { getOrdersAction } from "@/actions/admin";
import { OrdersClient } from "./orders-client";

/**
 * =====================================================================
 * ADMIN ORDERS PAGE - Quản lý đơn hàng (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PAGINATION LOGIC:
 * - Trang này xử lý phân trang bằng cách lấy `page` từ URL.
 * - `limit` được cố định là 10 đơn hàng mỗi trang.
 *
 * 2. SERVER-SIDE FETCHING:
 * - Gọi `getOrdersAction` để lấy dữ liệu đơn hàng kèm thông tin phân trang (`meta`).
 * - Việc fetch data trên server giúp trang load nhanh và bảo mật hơn.
 *
 * 3. SEARCH INTEGRATION:
 * - Hỗ trợ tìm kiếm đơn hàng theo mã đơn hàng hoặc tên khách hàng thông qua tham số `search`.
 * =====================================================================
 */

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const search = params.search || "";

  const result = await getOrdersAction(page, limit, search);

  if (!("data" in result)) {
    return <div className="text-red-600">Error: {(result as any).error}</div>;
  }

  return (
    <OrdersClient
      orders={result.data || []}
      total={result.meta?.total || 0} // meta is optional in ApiResponse
      page={page}
      limit={limit}
    />
  );
}
