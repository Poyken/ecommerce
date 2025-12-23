/**
 * =====================================================================
 * PRODUCT CARD - Thẻ hiển thị sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC BADGES:
 * - Tự động hiển thị các nhãn "New", "Hot", hoặc "-X%" dựa trên thuộc tính của sản phẩm.
 * - Sử dụng Glassmorphism style để nhãn trông hiện đại và nổi bật trên nền ảnh.
 *
 * 2. IMAGE OPTIMIZATION:
 * - Sử dụng `next/image` với `sizes` để tối ưu hóa việc tải ảnh trên các thiết bị khác nhau.
 * - Có hiệu ứng zoom nhẹ khi hover (`group-hover:scale-110`).
 *
 * 3. QUICK ACTIONS:
 * - Cho phép thêm vào giỏ hàng hoặc xem nhanh sản phẩm ngay từ thẻ.
 * - Xử lý trường hợp sản phẩm có nhiều SKU (biến thể) bằng cách mở Dialog chọn SKU.
 * =====================================================================
 */

"use client";

import { Button } from "@/components/atoms/button";
import { MotionButton } from "@/components/atoms/motion-button";
import { Skeleton } from "@/components/atoms/skeleton";
import { CompactRating } from "@/components/molecules/review-preview";
import { SkuSelectionDialog } from "@/components/molecules/sku-selection-dialog";
import { WishlistButton } from "@/components/molecules/wishlist-button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Link } from "@/i18n/routing";
import { cn, formatCurrency } from "@/lib/utils";
import { ProductOption, Sku } from "@/types/models";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category?: string;
  isNew?: boolean;
  isHot?: boolean;
  isSale?: boolean;
  className?: string;
  skus?: Sku[];
  rating?: number;
  reviewCount?: number;
  initialIsWishlisted?: boolean;
  isCompact?: boolean;
  options?: ProductOption[];
}

export function ProductCard({
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
  const t = useTranslations("productCard");
  const tToast = useTranslations("common.toast");
  const [isImageReady, setIsImageReady] = useState(false);
  const { toast } = useToast();
  const [isSkuDialogOpen, setIsSkuDialogOpen] = useState(false);

  // Use custom hook for cart operations
  const { addToCart, isAdding } = useCart(name);

  useEffect(() => {
    if (imageUrl) {
      const img = new window.Image();
      img.src = imageUrl;
      if (img.complete) {
        requestAnimationFrame(() => setIsImageReady(true));
      } else {
        img.onload = () => setIsImageReady(true);
      }
    } else {
      requestAnimationFrame(() => setIsImageReady(true));
    }
  }, [imageUrl]);

  // ... (rest of the logic)

  const discountPercentage =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    // ... (handler logic)
    e.preventDefault();
    if (isAdding) return;

    const defaultSku = skus?.[0];

    // If multiple SKUs or default is out of stock, show dialog
    if ((skus && skus.length > 1) || (defaultSku && defaultSku.stock <= 0)) {
      setIsSkuDialogOpen(true);
      return;
    }

    if (!defaultSku?.id) {
      toast({
        title: tToast("error"),
        description: t("errorMissingInfo"),
        variant: "destructive",
      });
      return;
    }

    await addToCart(defaultSku.id, 1);
  };

  const handleConfirmSku = async (skuId: string) => {
    const success = await addToCart(skuId, 1);
    if (success) {
      setIsSkuDialogOpen(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative bg-white dark:bg-card rounded-4xl overflow-hidden border border-neutral-100 dark:border-white/5 transition-all duration-500",
        "hover:shadow-[0_32px_64px_-16px_rgba(194,97,75,0.15)] dark:hover:shadow-accent/10",
        "hover:border-accent/20 dark:hover:border-accent/20",
        !isCompact && "hover:-translate-y-3 hover:scale-[1.02]",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-3/4 overflow-hidden bg-neutral-50 dark:bg-neutral-900">
        <Link href={`/products/${id}`} className="relative block w-full h-full">
          <AnimatePresence mode="wait">
            {!isImageReady && (
              <motion.div
                key="skeleton"
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20"
              >
                <Skeleton className="w-full h-full rounded-none" />
              </motion.div>
            )}
          </AnimatePresence>

          <Image
            src={imageUrl || `https://picsum.photos/seed/${id}/400/600`}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-1000 ease-[0.16,1,0.3,1] group-hover:scale-110"
            onLoadingComplete={() => setIsImageReady(true)}
          />
        </Link>

        {/* Overlays */}
        <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Badges - Glassmorphism style */}
        <div
          className={cn(
            "absolute top-4 left-4 flex flex-col gap-2 z-10",
            isCompact && "top-3 left-3"
          )}
        >
          {isNew && (
            <span className="bg-accent/90 text-accent-foreground text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] backdrop-blur-md rounded-full shadow-lg">
              {t("new")}
            </span>
          )}
          {!isNew && isHot && (
            <span className="bg-primary/90 text-primary-foreground text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] backdrop-blur-md rounded-full shadow-lg">
              {t("hot")}
            </span>
          )}
          {!isNew && !isHot && isSale && discountPercentage > 0 && (
            <span className="bg-destructive/90 text-destructive-foreground text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] backdrop-blur-md rounded-full shadow-lg">
              -{discountPercentage}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
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

        {/* Quick Actions */}
        {!isCompact && (
          <div className="absolute bottom-6 left-6 right-6 flex gap-3 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-[0.16,1,0.3,1] z-20">
            <MotionButton
              animation="scale"
              className="flex-2 bg-white text-foreground hover:bg-accent hover:text-accent-foreground h-12 rounded-full font-bold text-xs tracking-wider uppercase shadow-2xl border-none hover:shadow-accent/30 hover:shadow-2xl transition-all duration-300"
              onClick={handleAddToCart}
              disabled={isAdding}
              loading={isAdding}
            >
              {!isAdding && <ShoppingBag size={16} className="mr-2" />}
              {isAdding ? "..." : t("addToCart")}
            </MotionButton>
            <Link href={`/products/${id}`} className="flex-1">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                className="w-full h-12 flex items-center justify-center bg-white/90 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 text-foreground rounded-full transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:border-accent/50 hover:shadow-xl hover:shadow-accent/20 cursor-pointer"
              >
                <Eye size={18} />
              </motion.div>
            </Link>
          </div>
        )}

        {isCompact && (
          <div className="absolute inset-x-3 bottom-3 z-20 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
            <Button
              size="sm"
              className="w-full bg-white/95 backdrop-blur-xl text-foreground border-none hover:bg-accent hover:text-accent-foreground rounded-full text-[10px] font-black h-9 shadow-xl hover:shadow-accent/20 transition-all duration-300"
              onClick={handleAddToCart}
              disabled={isAdding}
            >
              {isAdding ? "..." : t("addToCart")}
            </Button>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className={cn("p-6 space-y-3", isCompact && "p-4 space-y-1")}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            {category && !isCompact && (
              <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em] mb-1">
                {category}
              </p>
            )}
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

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-black tracking-tight",
                isCompact ? "text-base" : "text-xl"
              )}
            >
              {formatCurrency(price)}
            </span>
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

      {skus && skus.length > 0 && (
        <SkuSelectionDialog
          isOpen={isSkuDialogOpen}
          onOpenChange={setIsSkuDialogOpen}
          productName={name}
          skus={skus}
          options={options}
          onConfirm={handleConfirmSku}
          isAdding={isAdding}
          category={category}
          rating={rating}
          reviewCount={reviewCount}
        />
      )}
    </div>
  );
}
