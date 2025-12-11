import { ProductReviews } from "@/components/reviews/product-reviews";
import { Badge } from "@/components/ui/badge";
import { http } from "@/lib/http";
import { cookies } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductVariantSelector } from "./product-variant-selector";

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  skus: any[];
  options: any[];
  images?: string[];
  category: { name: string };
  brand: { name: string };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let product: ProductDetail | null = null;
  try {
    const res = await http<{ data: ProductDetail }>(`/products/${id}`);
    product = res.data;
  } catch (e) {
    console.error(e);
  }

  if (!product) {
    notFound();
  }

  // Ảnh giữ chỗ nếu không có
  const mainImage = product.images?.[0] || "https://placehold.co/600x400";

  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("accessToken")?.value;

  return (
    <div className="container mx-auto px-4 py-8 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center min-h-[400px]">
          <Image
            src={mainImage}
            alt={product.name}
            width={600}
            height={600}
            className="object-cover w-full h-full"
            unoptimized // Cho ảnh giữ chỗ
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex gap-2 mb-2">
              <Badge variant="outline">{product.brand?.name || "Brand"}</Badge>
              <Badge variant="secondary">
                {product.category?.name || "Category"}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
          </div>

          <ProductVariantSelector
            options={product.options}
            skus={product.skus}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>

      <div className="mt-16">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}
