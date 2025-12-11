import { getCategoriesAction } from "@/actions/admin";
import { CategoriesPageClient } from "./categories-client";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const { data: categories, error } = await getCategoriesAction(search);

  if (error) {
    return (
      <div className="text-red-600">
        Error loading categories: {error}
      </div>
    );
  }

  return <CategoriesPageClient categories={categories || []} />;
}
