import { getBrandsAction } from "@/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default async function BrandsPublicPage() {
  const { data: brands, error } = await getBrandsAction();

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-600">Error loading brands: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse by Brand</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {brands && brands.length > 0 ? (
          brands.map((brand: any) => (
            <Link key={brand.id} href={`/brands/${brand.id}`}>
              <Card className="hover:shadow-lg transition cursor-pointer h-full">
                <CardContent className="flex items-center justify-center p-8">
                  <h3 className="text-xl font-semibold text-center">{brand.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            No brands available
          </div>
        )}
      </div>
    </div>
  );
}
