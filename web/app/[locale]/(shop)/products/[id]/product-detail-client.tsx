"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { useToast } from "@/components/ui/use-toast";
import { MobileStickyCart } from "@/features/cart/components/mobile-sticky-cart";
import { useCart } from "@/features/cart/hooks/use-cart";
import { ProductImageGallery } from "@/features/products/components/product-image-gallery";
import { ProductVariantSelector } from "@/features/products/components/product-variant-selector";
import { RecentlyViewedSection } from "@/features/products/components/recently-viewed-section";
import { useRecentlyViewedStore } from "@/features/products/store/recently-viewed.store";
import { ProductReviews } from "@/features/reviews/components/product-reviews";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Product, Review, Sku } from "@/types/models";
import { Check, Shield, Truck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * =====================================================================
 * PRODUCT DETAIL CLIENT - Logic tương tác trang chi tiết sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. IMAGE SORTING LOGIC:
 * - `sortedImages`: Tự động sắp xếp ảnh gallery dựa trên thứ tự của các Option (ví dụ: Màu sắc).
 * - Giúp trải nghiệm người dùng đồng nhất: Khi chọn màu nào thì ảnh màu đó hiện lên đầu.
 *
 * 2. URL SYNC (Single Source of Truth):
 * - `skuId` được lưu trên URL (`?skuId=...`).
 * - Khi người dùng chọn variant khác, URL sẽ cập nhật mà không load lại trang (`replaceState`).
 * - Giúp người dùng có thể copy link chính xác của một variant cụ thể để share.
 *
 * 3. INTERACTIVE COMPONENTS:
 * - `ProductImageGallery`: Hiển thị ảnh lớn và danh sách ảnh con.
 * - `ProductVariantSelector`: Xử lý việc chọn Size, Color... và tìm SKU tương ứng.
 *   - [REFACTOR]: Logic thêm vào giỏ hàng (`handleAddToCart`) đã được đưa lên Client Component này
 *     để tái sử dụng cho cả VariantSelector và MobileStickyCart (Clean Architecture).
 * - `MobileStickyCart`: Thanh mua hàng luôn dính ở dưới màn hình mobile. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

interface ProductDetailClientProps {
  product: Product;
  initialImages: string[];
  initialReviews?: Review[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialMeta?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialPurchasedSkus?: any[];
}

export function ProductDetailClient({
  product,
  initialImages,
  initialReviews = [],
  initialMeta = null,
  initialPurchasedSkus = [],
}: ProductDetailClientProps) {
  const t = useTranslations("productDetail");
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addToCart, isAdding } = useCart(product.name);
  const addRecentlyViewed = useRecentlyViewedStore((state) => state.addProduct);

  // Track product view for Recently Viewed feature
  useEffect(() => {
    const firstImage = initialImages[0] || "";
    const firstSku = product.skus?.[0];
    addRecentlyViewed({
      id: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: firstImage,
      price: Number(firstSku?.price || 0),
      salePrice: firstSku?.salePrice ? Number(firstSku.salePrice) : undefined,
      categoryName: product.category?.name,
      brandName: product.brand?.name,
    });
    // Only run on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Initialize activeImage from URL to prevent flicker
  const initialSkuId = searchParams.get("skuId");
  const initialActiveImage = initialSkuId
    ? product.skus?.find((s) => s.id === initialSkuId)?.imageUrl || undefined
    : undefined;

  // Calculate Sorted Images based on Option Order (e.g. Color)
  const sortedImages = useMemo(() => {
    if (!product.options || product.options.length === 0) return initialImages;

    // Use the first option (usually Color) as the primary sorter
    const primaryOption = product.options[0];
    const orderedImages: string[] = [];
    const seenImages = new Set<string>();

    // 1. Collect images in order of Option Values
    primaryOption.values.forEach((val) => {
      // Find a SKU that has this option value
      const sku = product.skus?.find((s) =>
        s.optionValues?.some((ov) => ov.optionValue.id === val.id)
      );
      if (sku && sku.imageUrl && !seenImages.has(sku.imageUrl)) {
        orderedImages.push(sku.imageUrl);
        seenImages.add(sku.imageUrl);
      }
    });

    // 2. Add any remaining images from initialImages that were missed
    initialImages.forEach((img) => {
      if (!seenImages.has(img)) {
        orderedImages.push(img);
        seenImages.add(img);
      }
    });

    return orderedImages.length > 0 ? orderedImages : initialImages;
  }, [product, initialImages]);

  const [activeImage, setActiveImage] = useState<string | undefined>(
    initialActiveImage
  );

  // Single Source of Truth for Selection State
  const [currentSkuId, setCurrentSkuId] = useState<string | undefined>(
    initialSkuId || undefined
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const updateUrlCheck = useCallback(
    (skuId: string) => {
      const currentParams = new URLSearchParams(
        Array.from(searchParams.entries())
      );
      if (currentParams.get("skuId") === skuId) return;

      currentParams.set("skuId", skuId);
      window.history.replaceState(null, "", `?${currentParams.toString()}`);
    },
    [searchParams]
  );

  const handleImageClick = useCallback(
    (imageUrl: string) => {
      setActiveImage(imageUrl);

      // Find SKU with this image
      const targetSku = product.skus?.find((sku) => sku.imageUrl === imageUrl);
      if (targetSku) {
        setCurrentSkuId(targetSku.id);
        updateUrlCheck(targetSku.id);
      }
    },
    [product.skus, updateUrlCheck]
  );

  const handleSkuChange = useCallback(
    (sku: Sku | null) => {
      if (sku) {
        if (sku.imageUrl) setActiveImage(sku.imageUrl);
        setCurrentSkuId(sku.id);
        updateUrlCheck(sku.id);
      }
    },
    [updateUrlCheck]
  );

  // Calculate Review Metrics
  const reviews = product.reviews || [];
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
      : 5;

  // Handles adding the CURRENTLY SELECTED sku to cart
  const handleAddToCart = async () => {
    if (!currentSkuId) {
      toast({
        title: t("selectOptions"),
        description: t("selectOptionsDesc"),
        variant: "destructive",
      });
      return;
    }

    // Double check stock
    const selectedSku = product.skus?.find((s) => s.id === currentSkuId);
    if (!selectedSku || selectedSku.stock <= 0) {
      toast({
        title: t("outOfStock"),
        description: t("outOfStockDesc"),
        variant: "destructive",
      });
      return;
    }

    await addToCart(currentSkuId, 1);
  };

  const currentSku = product.skus?.find((s) => s.id === currentSkuId);
  const currentPrice = currentSku
    ? Number(currentSku.price)
    : Number(product.skus?.[0]?.price || 0);
  const currentSalePrice = currentSku?.salePrice
    ? Number(currentSku.salePrice)
    : Number(product.skus?.[0]?.salePrice || 0);
  const isOutOfStock = currentSku ? currentSku.stock <= 0 : false;

  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start",
        isLightboxOpen && "pointer-events-none"
      )}
    >
      {/* Immersive Image Gallery (Sticky) */}
      <div className="lg:col-span-7">
        <ProductImageGallery
          images={sortedImages}
          productName={product.name}
          activeImage={activeImage}
          onImageClick={handleImageClick}
          skus={product.skus || []}
          options={product.options || []}
          onLightboxChange={setIsLightboxOpen}
        />
      </div>

      {/* Product Info (Scrollable) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <m.div
          className="space-y-2"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-primary">
              {product.brand?.name || "Premium Brand"}
            </span>
            <div className="h-[1px] w-12 bg-border/20"></div>
            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">
              {product.category?.name || "Collection"}
            </span>
          </div>

          <div className="flex justify-between items-start gap-6">
            <h1 className="text-4xl md:text-5xl lg:text-8xl font-black tracking-tighter text-foreground uppercase italic leading-[0.9]">
              {product.name}
            </h1>
            <WishlistButton
              productId={product.id}
              initialIsWishlisted={false}
              className="mt-2 text-foreground"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex text-amber-400 gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-lg",
                    i < Math.round(averageRating)
                      ? "text-amber-400"
                      : "text-gray-300"
                  )}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              {t("verifiedReviews", { count: reviewCount })}
            </span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed font-medium border-l border-border/20 pl-6 max-w-xl">
            {product.description}
          </p>
        </m.div>

        <div className="mt-4">
          <div className="glass-premium p-8 md:p-10 space-y-4 border-border/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-linear-to-r from-transparent via-border/20 to-transparent" />
            <ProductVariantSelector
              options={product.options || []}
              skus={product.skus || []}
              selectedSkuId={currentSkuId}
              onSkuChange={handleSkuChange}
              onImageChange={(url) => setActiveImage(url)}
              // New Props for centralised logic
              onAddToCart={handleAddToCart}
              isAdding={isAdding}
            />

            <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-8 border-t border-border/10">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                <Truck className="h-4 w-4 text-primary" />
                <span>{t("freeGlobalShipping")}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                <Shield className="h-4 w-4 text-primary" />
                <span>{t("warranty")}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                <Check className="h-4 w-4 text-primary" />
                <span>{t("authenticityVerified")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/10">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-3xl font-black tracking-tighter uppercase italic text-foreground flex items-center gap-4">
              {t("customerReviews")}
              <div className="h-px w-24 bg-border/20" />
            </h3>
          </div>
          <ProductReviews
            productId={product.id}
            initialReviews={initialReviews}
            initialMeta={initialMeta}
            initialPurchasedSkus={initialPurchasedSkus}
          />
        </div>

        {/* Recently Viewed Section */}
        <div className="pt-8 border-t border-border/10">
          <RecentlyViewedSection
            currentProductId={product.id}
            maxDisplay={6}
            title={t("recentlyViewed")}
          />
        </div>
      </div>

      <MobileStickyCart
        productName={product.name}
        price={currentPrice}
        salePrice={currentSalePrice}
        onAddToCart={handleAddToCart}
        isOutOfStock={isOutOfStock}
        isAdding={isAdding}
      />
    </div>
  );
}
