import { getBrandsAction } from "@/features/admin/actions";
import { BrandsPageClient } from "./brands-client";



export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  const result = await getBrandsAction(page, limit, search);

  if ("error" in result) {
    return (
      <div className="text-red-600">Error loading brands: {result.error}</div>
    );
  }

  return <BrandsPageClient brands={result.data || []} meta={result.meta} />;
}
