/**
 * =====================================================================
 * RECENTLY VIEWED SECTION - Hiển thị sản phẩm đã xem gần đây
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CLIENT COMPONENT:
 * - Sử dụng "use client" vì cần truy cập localStorage (chỉ có trên browser).
 * - Dùng useEffect để tránh hydration mismatch.
 *
 * 2. LAZY RENDERING:
 * - Chỉ render khi có sản phẩm để hiển thị.
 * - Responsive: 2 cột mobile, 4-6 cột desktop.
 *
 * 3. PERSONALIZATION STRATEGY:
 * - Loại bỏ sản phẩm đang xem khỏi danh sách.
 * - Hiển thị tối đa 8 sản phẩm để không làm loãng focus. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { OptimizedImage } from "@/components/shared/optimized-image";
import { Button } from "@/components/ui/button";
import { useQuickViewStore } from "@/features/products/store/quick-view.store";
import {
  RecentlyViewedProduct,
  useRecentlyViewedStore,
} from "@/features/products/store/recently-viewed.store";
import { formatCurrency } from "@/lib/utils";
import { Clock, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RecentlyViewedSectionProps {
  /** ID sản phẩm hiện tại để loại trừ khỏi danh sách */
  currentProductId?: string;
  /** Số lượng sản phẩm tối đa hiển thị */
  maxDisplay?: number;
  /** Tiêu đề section */
  title?: string;
  /** Hiển thị nút "Xóa tất cả" */
  showClearButton?: boolean;
}

export function RecentlyViewedSection({
  currentProductId,
  maxDisplay = 8,
  title = "Sản phẩm đã xem gần đây",
  showClearButton = false,
}: RecentlyViewedSectionProps) {
  // Tránh hydration mismatch bằng cách chỉ render sau khi mount
  const [mounted, setMounted] = useState(false);
  const products = useRecentlyViewedStore((state) => state.products);
  const clearAll = useRecentlyViewedStore((state) => state.clearAll);
  const open = useQuickViewStore((state) => state.open);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Lọc và giới hạn số lượng sản phẩm
  const displayProducts = products
    .filter((p) => p.id !== currentProductId)
    .slice(0, maxDisplay);

  // Không render nếu chưa mount hoặc không có sản phẩm
  if (!mounted || displayProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl md:text-2xl font-serif font-medium">
            {title}
          </h2>
          <span className="text-sm text-muted-foreground">
            ({displayProducts.length})
          </span>
        </div>

        {showClearButton && displayProducts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4 mr-1" />
            Xóa tất cả
          </Button>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayProducts.map((product) => (
          <RecentlyViewedCard
            key={product.id}
            product={product}
            onQuickView={() =>
              open({
                productId: product.id,
                initialData: {
                  name: product.name,
                  price: product.salePrice || product.price,
                  imageUrl: product.imageUrl,
                  category: product.categoryName,
                },
              })
            }
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Card nhỏ gọn cho sản phẩm đã xem
 */
function RecentlyViewedCard({
  product,
  onQuickView,
}: {
  product: RecentlyViewedProduct;
  onQuickView: () => void;
}) {
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  return (
    <div className="group relative bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
      {/* Image */}
      <Link href={`/products/${product.slug || product.id}`}>
        <div className="relative aspect-4/5 overflow-hidden">
          <OptimizedImage
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />

          {/* Quick View Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickView();
            }}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <span className="bg-white/90 text-black text-xs px-3 py-1.5 rounded-full font-medium">
              Xem nhanh
            </span>
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        {/* Category */}
        {product.categoryName && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 truncate">
            {product.categoryName}
          </p>
        )}

        {/* Name */}
        <Link href={`/products/${product.slug || product.id}`}>
          <h3 className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(product.salePrice || product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
