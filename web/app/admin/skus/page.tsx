import { getSkusAction } from "@/actions/admin";
import { SkusClient } from "./skus-client";

export default async function SKUsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const status = params.status === "ALL" ? undefined : params.status;

  const result = await getSkusAction(page, limit, status);

  if (result.error) {
    return (
      <div className="p-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
          <h2 className="font-bold mb-2">Error loading SKUs</h2>
          <p>{result.error}</p>
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
