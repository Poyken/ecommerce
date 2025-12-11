
import { getOrdersAction } from "@/actions/admin";
import { OrdersClient } from "./orders-client";

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

  if (result.error) {
    return <div className="text-red-600">Error: {result.error}</div>;
  }

  return (
    <div className="p-6">
      <OrdersClient
        orders={result.data || []}
        total={result.meta?.total || 0}
        page={page}
        limit={limit}
      />
    </div>
  );
}
