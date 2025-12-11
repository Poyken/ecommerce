import { getBrandsAction } from "@/actions/admin";
import { BrandsPageClient } from "./brands-client";

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const { data: brands, error } = await getBrandsAction(search);

  if (error) {
    return (
      <div className="text-red-600">
        Error loading brands: {error}
      </div>
    );
  }

  return <BrandsPageClient brands={brands || []} />;
}
