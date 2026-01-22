import { getProductsAction } from "@/features/admin/actions";
import { getTranslations } from "next-intl/server";
import { ProductsClient } from "./products-client";



export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; filter?: string }>;
}) {
  const t = await getTranslations("admin.products");
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const search = params.search || "";

  // Fetch products only - Brands and Categories are handled by AdminMetadataProvider in Layout
  const filter = params.filter;

  // Map filters to API params
  const apiParams: any = { page, limit, search };
  if (filter === "recent") {
    apiParams.sort = "newest"; 
    // If backend supported date filtering, we'd add startDate here
  } else if (filter === "no-category") {
    apiParams.categoryId = "null"; // Assuming backend handles string "null" or we need to fix service
  }

  const [productsRes] = await Promise.all([
    getProductsAction(apiParams),
  ]);

  if (!("data" in productsRes)) {
    return (
      <div className="p-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
          <h2 className="font-bold mb-2">{t("errorLoading")}</h2>
          <p>{(productsRes as any).error}</p>
        </div>
      </div>
    );
  }

  return (
    <ProductsClient
      products={productsRes.data || []}
      total={productsRes.meta?.total || 0}
      page={page}
      limit={limit}
    />
  );
}
