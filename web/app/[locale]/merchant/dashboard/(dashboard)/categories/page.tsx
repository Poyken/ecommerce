import { getCategoriesAction } from "@/features/admin/actions";
import { CategoriesPageClient } from "./categories-client";



export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  const result = await getCategoriesAction(page, limit, search);

  if ("error" in result) {
    return (
      <div className="text-red-600">
        Error loading categories: {result.error}
      </div>
    );
  }

  return (
    <CategoriesPageClient categories={result.data || []} meta={result.meta} />
  );
}
