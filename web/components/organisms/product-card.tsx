/**
 * =====================================================================
 * PRODUCT CARD - Thẻ hiển thị sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPONENT OPTIMIZATION (`React.memo`):
 * - ProductCard thường xuất hiện trong danh sách dài (Grid 20-50 items).
 * - `memo` giúp chặn việc render lại (re-render) nếu props (như price, name) không đổi.
 * - Cực kỳ quan trọng để giữ FPS cao khi user cuộn trang.
 *
 * 2. CLIENT COMPONENT ("use client"):
 * - Vì component này CÓ tương tác (Hover, Click, Add to Cart), nó bắt buộc phải chạy ở Client.
 *
 * 3. COMPOSITION PATTERN:
 * - Thay vì viết hết logic vào đây, ta tách nhỏ ra các components con:
 *   + `OptimizedImage`: Xử lý ảnh (Lazy load, Blur effect).
 *   + `WishlistButton`: Logic yêu thích tách biệt.
 *   + `QuickViewDialog`: Logic popup phức tạp.
 * - Giúp code dễ đọc, dễ test và dễ bảo trì (Separation of Concerns).
 *
 * 4. HYDRATION MISMATCH PREVENT:
 * - `isMounted` state để đảm bảo các phần UI phụ thuộc browser (như Feature Flags) chỉ render sau khi đã mount.
 * - Tránh lỗi HTML Server khác HTML Client gây warning.
 * =====================================================================
 */

"use client";

import { Button } from "@/components/atoms/button";
import { MotionButton } from "@/components/atoms/motion-button";
import { OptimizedImage } from "@/components/atoms/optimized-image";
import { CompactRating } from "@/components/molecules/review-preview";
import { WishlistButton } from "@/components/molecules/wishlist-button";
import { ProductQuickViewDialog } from "@/components/organisms/product-quick-view-dialog";
import { useFeatureFlags } from "@/hooks/use-feature-flags";
import { useStock } from "@/hooks/use-stock";
import { Link } from "@/i18n/routing";
import { cn, formatCurrency } from "@/lib/utils";
import { ProductOption, Sku } from "@/types/models";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useEffect, useState } from "react";

// Định nghĩa Props cho component
// Dùng interface để dễ dàng mở rộng sau này
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
 * ProductCard Component
 * Sử dụng `memo` để tối ưu performance khi render danh sách lớn.
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
  // -------------------------------------------------------------------

  // Hook đa ngôn ngữ (i18n) - Lấy text từ file json
  const t = useTranslations("productCard");

  // State quản lý việc hiển thị Dialog Xem nhanh
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // State để check xem component đã mount lên DOM chưa
  // Dùng để tránh lỗi Hydration Mismatch (Server render khác Client render)
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Hook kiểm tra Feature Flags (Bật/Tắt tính năng động)
  const { isEnabled } = useFeatureFlags();

  // 2. XỬ LÝ LOGIC BUSINESS
  // -------------------------------------------------------------------

  // Lấy SKU mặc định (thường là cái đầu tiên) để check tồn kho
  const defaultSku = skus?.[0];

  // Hook theo dõi tồn kho Real-time qua WebSocket
  // Nếu server báo hết hàng, UI sẽ tự cập nhật ngay lập tức
  const currentStock = useStock(defaultSku?.stock ?? 0, defaultSku?.id);

  // Logic hiển thị nhãn "Sắp hết hàng" khi tồn kho < 5
  const isLowStock = currentStock > 0 && currentStock < 5;

  // Tính phần trăm giảm giá: ((Giá gốc - Giá bán) / Giá gốc) * 100
  // Chỉ tính nếu có giá gốc và giá gốc > giá bán
  const discountPercentage =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  // 3. RENDER UI
  // -------------------------------------------------------------------
  return (
    <div
      // Sử dụng `cn` để merge class mặc định và class truyền vào props.
      // group: Để enable các hiệu ứng hover cho phần tử con (group-hover).
      // relative: Để định vị absolute cho các badge bên trong.
      className={cn(
        "group relative bg-white dark:bg-card rounded-3xl overflow-hidden border border-neutral-100 dark:border-white/5 transition-all duration-300",
        "hover:shadow-xl hover:shadow-accent/5 dark:hover:shadow-accent/10", // Hiệu ứng đổ bóng khi hover
        "hover:border-accent/30 dark:hover:border-accent/20", // Đổi màu viền khi hover
        !isCompact && "hover:-translate-y-2", // Bay lên nhẹ khi hover (nếu không phải compact mode)
        className
      )}
    >
      {/* 
        A. PHẦN HÌNH ẢNH (IMAGE CONTAINER)
        Tỉ lệ khung hình 4:5 (aspect-4/5) chuẩn thời trang/nội thất 
      */}
      <div className="relative aspect-4/5 overflow-hidden bg-neutral-50 dark:bg-neutral-900">
        {/* Link bao quanh ảnh để click vào xem chi tiết */}
        <Link href={`/products/${id}`} className="relative block w-full h-full">
          {/* OptimizedImage component xử lý lazy loading và placeholder blur */}
          <OptimizedImage
            src={imageUrl || "/images/placeholders/product-placeholder.jpg"}
            alt={name}
            fill // Fill container cha
            // sizes: Quan trọng cho Next.js Image Optimization - tải ảnh đúng kích thước màn hình
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            containerClassName="w-full h-full"
            // Zoom ảnh nhẹ khi hover vào card cha (group-hover:scale-110)
            className="object-cover transition-transform duration-1000 ease-[0.16,1,0.3,1] group-hover:scale-110"
            showShimmer={true} // Hiệu ứng shimmer loading
          />
        </Link>

        {/* Lớp phủ (Overlay) gradient tối ở dưới đáy ảnh để làm nổi bật text (nếu có) */}
        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* 
          B. CÁC NHÃN (BADGES) 
          Hiển thị New, Hot, Sale, Low Stock
        */}
        <div
          className={cn(
            "absolute top-4 left-4 flex flex-col items-start gap-2 z-10",
            isCompact && "top-3 left-3"
          )}
        >
          {/* Badge NEW: Chỉ hiện nếu feature flag bật và sản phẩm mới */}
          {isMounted && isEnabled("show_new_arrival_badge") && isNew && (
            <span className="w-fit bg-accent/90 text-accent-foreground text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] backdrop-blur-md rounded-full shadow-lg">
              {t("new")}
            </span>
          )}

          {/* Badge LOW STOCK: Có hiệu ứng pulse (nhấp nháy nhẹ) để gây chú ý */}
          {isLowStock && (
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-fit bg-orange-500/90 text-white text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] backdrop-blur-md rounded-full shadow-lg animate-pulse"
            >
              {t("lowStock") || "Low Stock"}
            </motion.span>
          )}

          {/* Badge HOT */}
          {!isNew && isHot && (
            <span className="w-fit bg-primary/90 text-primary-foreground text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] backdrop-blur-md rounded-full shadow-lg">
              {t("hot")}
            </span>
          )}

          {/* Badge SALE % */}
          {!isNew && !isHot && isSale && discountPercentage > 0 && (
            <span className="w-fit bg-destructive/90 text-destructive-foreground text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] backdrop-blur-md rounded-full shadow-lg">
              -{discountPercentage}%
            </span>
          )}
        </div>

        {/* 
          C. WISHLIST BUTTON (Nút yêu thích)
          Nằm góc trên bên phải, chỉ hiện khi hover (trên Desktop)
        */}
        <div
          className={cn(
            "absolute z-20 transition-all duration-500",
            isCompact ? "top-3 right-3" : "top-5 right-5",
            !isCompact &&
              "opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
          )}
        >
          <WishlistButton
            productId={id}
            initialIsWishlisted={initialIsWishlisted}
            className="w-10 h-10 bg-white/90 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 text-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent/50 hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 shadow-xl rounded-full"
          />
        </div>

        {/* 
          D. QUICK VIEW ACTION (Nút xem nhanh)
          Khác nhau giữa Compact mode và Normal mode
        */}
        {!isCompact && (
          // Normal mode: Nút to ở giữa, bay lên từ dưới
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-[opacity,transform] duration-500 z-20 translate-y-4 group-hover:translate-y-0">
            <MotionButton
              animation="scale"
              className="pointer-events-auto min-w-[140px] bg-white text-foreground hover:bg-accent hover:text-accent-foreground h-12 rounded-full font-bold text-xs tracking-wider uppercase shadow-2xl border-none hover:shadow-accent/30 hover:shadow-2xl transition-[background-color,color,box-shadow,opacity] duration-300 px-6 backdrop-blur-md transform-gpu"
              onClick={(e) => {
                e.preventDefault(); // Ngăn chặn click vào Link cha
                setIsQuickViewOpen(true);
              }}
            >
              <Eye size={16} className="mr-2 shrink-0" />
              <span>{t("quickView") || "Quick View"}</span>
            </MotionButton>
          </div>
        )}

        {isCompact && (
          // Compact mode: Nút nhỏ ở dưới cùng
          <div className="absolute inset-x-3 bottom-3 z-20 opacity-0 group-hover:opacity-100 transition-[opacity,transform] duration-300 translate-y-2 group-hover:translate-y-0">
            <Button
              size="sm"
              className="w-full bg-white/95 backdrop-blur-xl text-foreground border-none hover:bg-accent hover:text-accent-foreground rounded-full text-[10px] font-black h-9 shadow-xl hover:shadow-accent/20 transition-[background-color,color,box-shadow] duration-300 transform-gpu"
              onClick={(e) => {
                e.preventDefault();
                setIsQuickViewOpen(true);
              }}
            >
              {t("quickView") || "Quick View"}
            </Button>
          </div>
        )}
      </div>

      {/* 
        E. THÔNG TIN SẢN PHẨM (INFO SECTION)
        Tên, Giá, Category, Rating
      */}
      <div className={cn("p-6 space-y-3", isCompact && "p-4 space-y-1")}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Category Label */}
            {category && !isCompact && (
              <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em] mb-1">
                {category}
              </p>
            )}

            {/* Product Name Link */}
            <Link href={`/products/${id}`} className="block">
              <h3
                className={cn(
                  "font-sans font-bold leading-tight truncate group-hover:text-primary transition-colors duration-300",
                  isCompact ? "text-sm" : "text-lg"
                )}
              >
                {name}
              </h3>
            </Link>
          </div>
        </div>

        {/* Price & Rating Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Giá hiện tại */}
            <span
              className={cn(
                "font-black tracking-tight",
                isCompact ? "text-base" : "text-xl"
              )}
            >
              {formatCurrency(price)}
            </span>

            {/* Giá gốc (gạch ngang) */}
            {originalPrice !== undefined && originalPrice > price && (
              <span
                className={cn(
                  "text-muted-foreground line-through opacity-50",
                  isCompact ? "text-[10px]" : "text-sm"
                )}
              >
                {formatCurrency(originalPrice!)}
              </span>
            )}
          </div>

          {/* Rating Stars */}
          {rating !== undefined &&
            reviewCount !== undefined &&
            reviewCount > 0 && (
              <CompactRating
                rating={rating!}
                reviewCount={reviewCount!}
                className={cn(isCompact ? "scale-90 origin-right" : "")}
              />
            )}
        </div>
      </div>

      {/* 
        F. DIALOG XEM NHANH
        Render ở cuối cùng để không ảnh hưởng layout
      */}
      <ProductQuickViewDialog
        isOpen={isQuickViewOpen}
        onOpenChange={setIsQuickViewOpen}
        productId={id}
        initialData={{
          name,
          price,
          imageUrl,
          category,
        }}
      />
    </div>
  );
});
