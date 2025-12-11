import { getProductsAction } from "@/actions/admin";
import { ProductsClient } from "./products-client";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const search = params.search || "";

  const result = await getProductsAction(page, limit, search);

  if (result.error) {
    return (
      <div className="p-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
          <h2 className="font-bold mb-2">Error loading products</h2>
          <p>{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <ProductsClient
      products={result.data || []}
      total={result.meta?.total || 0}
      page={page}
      limit={limit}
    />
  );
}
