/**
 * =====================================================================
 * PROFILE WISHLIST TAB - Tab danh sách sản phẩm yêu thích
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PRODUCT GRID:
 * - Hiển thị danh sách sản phẩm yêu thích dưới dạng lưới (grid).
 * - Tái sử dụng component `ProductCard` để đảm bảo tính nhất quán về UI/UX.
 *
 * 2. REAL-TIME SYNC:
 * - Dữ liệu được fetch trực tiếp từ API khi tab được mở, đảm bảo danh sách luôn mới nhất.
 *
 * 3. EMPTY STATE:
 * - Nếu chưa có sản phẩm nào, hiển thị nút "Browse Shop" để khuyến khích người dùng khám phá sản phẩm. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { getWishlistAction } from "@/features/wishlist/actions";
import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { ProductCard } from "@/features/products/components/product-card";
import { Link } from "@/i18n/routing";
import { Product } from "@/types/models";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getProductImage } from "@/lib/product-helper";

export function ProfileWishlistTab() {
  const t = useTranslations("wishlist");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await getWishlistAction();
        if (res.success && res.data) {
          setProducts(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch wishlist", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[400px] rounded-2xl bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <GlassCard className="p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <Heart className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">{t("empty")}</h3>
        <p className="text-muted-foreground mb-6">{t("emptyDesc")}</p>
        <Link href="/shop">
          <GlassButton className="bg-primary text-primary-foreground">
            {t("browseShop")}
          </GlassButton>
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("subtitle", { count: products.length })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {products.map((product, index) => {
            const defaultSku = product.skus?.[0];
            const regularPrice = defaultSku?.price
              ? Number(defaultSku.price)
              : 0;
            const salePrice = defaultSku?.salePrice
              ? Number(defaultSku.salePrice)
              : undefined;

            const displayPrice = salePrice ?? regularPrice;
            const originalPrice = salePrice ? regularPrice : undefined;

            const reviewCount =
              product._count?.reviews || product.reviews?.length || 0;
            const averageRating = product.reviews?.length
              ? product.reviews.reduce((acc, r) => acc + r.rating, 0) /
                product.reviews.length
              : 5;

            return (
              <m.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={displayPrice}
                  originalPrice={originalPrice}
                  imageUrl={getProductImage(product) || ""}
                  category={product.category?.name}
                  skus={product.skus}
                  options={product.options}
                  rating={averageRating}
                  reviewCount={reviewCount}
                  initialIsWishlisted={true}
                />
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
