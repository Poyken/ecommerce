

import { OptimizedImage } from "@/components/shared/optimized-image";
import { formatCurrency } from "@/lib/utils";
import { productService } from "@/features/products/services/product.service";
import { Product } from "@/types/models";
import { Sparkles } from "lucide-react";
import Link from "next/link";

interface ProductRecommendationsProps {
  /** ID của sản phẩm hiện tại để loại trừ */
  currentProductId: string;
  /** ID của category để tìm sản phẩm tương tự */
  categoryId?: string;
  /** Số lượng sản phẩm tối đa */
  maxItems?: number;
  /** Tiêu đề section */
  title?: string;
}

/**
 * Server Component để fetch và hiển thị sản phẩm gợi ý
 */
export async function ProductRecommendations({
  currentProductId,
  categoryId,
  maxItems = 8,
  title = "Có thể bạn cũng thích",
}: ProductRecommendationsProps) {
  // Không fetch nếu không có categoryId
  if (!categoryId) {
    return null;
  }

  let recommendations: Product[] = [];

  try {
    // Fetch sản phẩm cùng category, loại trừ sản phẩm hiện tại
    const response = await productService.getProducts({
      categoryId,
      page: 1,
      limit: maxItems + 1, // +1 để đảm bảo có đủ sau khi loại trừ
    });

    // Filter out current product
    recommendations = response.data
      .filter((p) => p.id !== currentProductId)
      .slice(0, maxItems);
  } catch {
    return null;
  }

  // Không hiển thị nếu không có recommendations
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 border-t border-border/50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-2xl md:text-3xl font-serif font-medium">{title}</h2>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
        {recommendations.map((product) => (
          <RecommendationCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

/**
 * Card cho sản phẩm gợi ý
 */
function RecommendationCard({ product }: { product: Product }) {
  // Get first image
  const firstImage = product.images?.[0];
  const imageUrl =
    typeof firstImage === "string"
      ? firstImage
      : firstImage?.url || product.skus?.[0]?.imageUrl || "";

  // Get price from SKU or product
  const price = Number(
    product.skus?.[0]?.price || product.minPrice || product.maxPrice || 0
  );
  const salePrice = product.skus?.[0]?.salePrice
    ? Number(product.skus[0].salePrice)
    : undefined;
  const hasDiscount = salePrice && salePrice < price;

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="group block"
    >
      <div className="relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <OptimizedImage
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full">
              -{Math.round(((price - salePrice) / price) * 100)}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {/* Category / Brand */}
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 truncate">
            {product.brand?.name || product.category?.name}
          </p>

          {/* Name */}
          <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">
              {formatCurrency(hasDiscount ? salePrice : price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
