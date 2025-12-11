import { Card, CardContent } from "@/components/ui/card";
import { http } from "@/lib/http";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brand: {
    id: string;
    name: string;
  };
  skus: {
    price: number;
    salePrice?: number;
  }[];
}

export default async function BrandProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let products: Product[] = [];
  let brandName = "";

  try {
    // Lấy tất cả sản phẩm và lọc theo thương hiệu ở phía client
    const res = await http<{ data: Product[] }>("/products?limit=100");
    products = res.data?.filter((p: Product) => p.brand.id === id) || [];
    brandName = products[0]?.brand.name || "Brand";
  } catch (error) {
    console.error("Lỗi khi tải sản phẩm của thương hiệu:", error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/brands" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Brands
        </Link>
        <h1 className="text-3xl font-bold">{brandName}</h1>
        <p className="text-gray-600 mt-2">{products.length} products found</p>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const minPrice = Math.min(...product.skus.map((sku) => Number(sku.salePrice || sku.price)));
            return (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="hover:shadow-lg transition h-full">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-md mb-4 relative">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        No Image
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-primary">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(minPrice)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No products found for this brand
        </div>
      )}
    </div>
  );
}
