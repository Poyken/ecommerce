/**
 * =====================================================================
 * PRODUCT CARD - Thẻ hiển thị sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SMART/DUMB COMPONENT PATTERN:
 * - `ProductCard` (Smart): Kết nối với Hooks (Stock, Feature Flags, etc).
 * - `ProductCardBase` (Dumb): Chỉ nhận props và hiển thị UI.
 * - Giúp dễ dàng reuse UI ở các chỗ khác (VD: trong Storybook hoặc Admin Preview).
 *
 * 2. COMPOSITION:
 * - Các nút bấm (QuickView, Wishlist) được truyền vào `ProductCardBase` qua prop `actions`.
 * =====================================================================
 */

"use client";

import { MotionButton } from "@/components/shared/motion-button";
import { Button } from "@/components/ui/button";
import { useFeatureFlags } from "@/features/admin/hooks/use-feature-flags";
import { useStock } from "@/features/products/hooks/use-stock";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { ProductOption, Sku } from "@/types/models";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useState } from "react";
import { preload } from "swr";
import { useQuickViewStore } from "../store/quick-view.store";
import { ProductCardBase } from "./product-card-base";

// Định nghĩa Props cho component
interface ProductCardProps {
  id: string; // ID duy nhất của sản phẩm
  name: string; // Tên hiển thị
  price: number; // Giá bán hiện tại
  originalPrice?: number; // Giá gốc (để tính % giảm giá)
  imageUrl: string; // URL ảnh đại diện
  category?: string; // Tên danh mục (Optional)
  isNew?: boolean; // Cờ đánh dấu sản phẩm mới
  isHot?: boolean; // Cờ đánh dấu sản phẩm bán chạy
  isSale?: boolean; // Cờ đánh dấu đang giảm giá
  className?: string; // Class tùy chỉnh từ bên ngoài truyền vào
  skus?: Sku[]; // Danh sách các biến thể (Màu, Size...)
  rating?: number; // Điểm đánh giá (1-5)
  reviewCount?: number; // Số lượng đánh giá
  initialIsWishlisted?: boolean; // Trạng thái yêu thích ban đầu (tối ưu UI optimistic)
  isCompact?: boolean; // Chế độ hiển thị nhỏ gọn (cho Mobile hoặc Sidebar)
  options?: ProductOption[]; // Các tùy chọn của sản phẩm
}

/**
 * ProductCard Component (Smart Container)
 * Uses `ProductCardBase` for UI.
 */
export const ProductCard = memo(function ProductCard({
  id,
  name,
  price,
  originalPrice,
  imageUrl,
  category,
  isNew,
  isHot,
  isSale,
  className,
  skus,
  rating,
  reviewCount,
  initialIsWishlisted = false,
  isCompact = false,
  options,
}: ProductCardProps) {
  // 1. HOOKS KHỞI TẠO
  const t = useTranslations("productCard");
  const { openQuickView } = useQuickViewStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Hook kiểm tra Feature Flags
  const { isEnabled } = useFeatureFlags();

  // 1.1 LOGIC PRE-FETCHING (Tối ưu trải nghiệm)
  // Khi user hover vào card, ta tải trước thông tin chi tiết
  // Giúp QuickView hoặc Navigation trang sau nhanh tức thì
  const prefetchProduct = useCallback(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    preload(`${apiUrl}/products/${id}`, (url) =>
      fetch(url).then((res) => res.json())
    );
  }, [id]);

  // 2. XỬ LÝ LOGIC BUSINESS
  const defaultSku = skus?.[0];
  const currentStock = useStock(defaultSku?.stock ?? 0, defaultSku?.id);
  const isLowStock = currentStock > 0 && currentStock < 5;

  // 3. DEFINE ACTIONS
  const quickViewAction = !isCompact ? (
    <MotionButton
      animation="scale"
      className="pointer-events-auto min-w-[140px] bg-white text-foreground hover:bg-accent hover:text-accent-foreground h-12 rounded-full font-bold text-xs tracking-wider uppercase shadow-2xl border-none hover:shadow-accent/30 hover:shadow-2xl transition-[background-color,color,box-shadow,opacity] duration-300 px-6 backdrop-blur-md transform-gpu"
      onClick={(e) => {
        e.preventDefault();
        openQuickView(id, undefined, { name, price, imageUrl, category });
      }}
    >
      <Eye size={16} className="mr-2 shrink-0" />
      <span>{t("quickView") || "Quick View"}</span>
    </MotionButton>
  ) : (
    <Button
      size="sm"
      className="w-full bg-white/95 backdrop-blur-xl text-foreground border-none hover:bg-accent hover:text-accent-foreground rounded-full text-[10px] font-black h-9 shadow-xl hover:shadow-accent/20 transition-[background-color,color,box-shadow] duration-300 transform-gpu"
      onClick={(e) => {
        e.preventDefault();
        openQuickView(id, undefined, { name, price, imageUrl, category });
      }}
    >
      {t("quickView") || "Quick View"}
    </Button>
  );

  const wishlistAction = (
    <WishlistButton
      productId={id}
      initialIsWishlisted={initialIsWishlisted}
      className="w-10 h-10 bg-white/90 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 text-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent/50 hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 shadow-xl rounded-full"
    />
  );

  return (
    <>
      <ProductCardBase
        id={id}
        name={name}
        price={price}
        originalPrice={originalPrice}
        imageUrl={imageUrl}
        category={category}
        rating={rating}
        reviewCount={reviewCount}
        isNew={isMounted && isEnabled("show_new_arrival_badge") ? isNew : false}
        isHot={isHot}
        isSale={isSale}
        isLowStock={isLowStock}
        isCompact={isCompact}
        className={className}
        actions={{
          wishlist: wishlistAction,
          quickView: quickViewAction,
        }}
        onMouseEnter={prefetchProduct}
      />


    </>
  );
});
