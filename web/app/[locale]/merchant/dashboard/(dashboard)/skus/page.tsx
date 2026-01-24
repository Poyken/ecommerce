import { getSkusAction } from "@/features/admin/actions";
import { SkusClient } from "./skus-client";



async function getSkuCounts() {
  try {
    const [all, active, inactive, lowStock] = await Promise.all([
      getSkusAction({ page: 1, limit: 1 }),
      getSkusAction({ page: 1, limit: 1, status: "ACTIVE" }),
      getSkusAction({ page: 1, limit: 1, status: "INACTIVE" }),
      getSkusAction({ page: 1, limit: 1, stockLimit: 10 }),
    ]);

    return {
      total: all.meta?.total || 0,
      active: active.meta?.total || 0,
      inactive: inactive.meta?.total || 0,
      lowStock: lowStock.meta?.total || 0,
    };
  } catch (error) {
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
    getSkusAction({ page, limit, status, search, stockLimit }),
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
