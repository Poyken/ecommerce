"use client";

import { GlassCard } from "@/components/atoms/glass-card";
import { ProductVariantSelector } from "@/components/molecules/product-variant-selector";
import { WishlistButton } from "@/components/molecules/wishlist-button";
import { MobileStickyCart } from "@/components/organisms/mobile-sticky-cart";
import { ProductImageGallery } from "@/components/organisms/product-image-gallery";
import { ProductReviews } from "@/components/organisms/product-reviews";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Product, Sku } from "@/types/models";
import { motion } from "framer-motion";
import { Check, Shield, Truck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

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
 * - `MobileStickyCart`: Thanh mua hàng luôn dính ở dưới màn hình mobile.
 * =====================================================================
 */

interface ProductDetailClientProps {
  product: Product;
  initialImages: string[];
  isLoggedIn: boolean;
}

export function ProductDetailClient({
  product,
  initialImages,
  isLoggedIn,
}: ProductDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addToCart, isAdding } = useCart(product.name);

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
        title: "Please select options",
        description:
          "You must select all options (Size, Color) before adding to cart.",
        variant: "destructive",
      });
      return;
    }

    // Double check stock
    const selectedSku = product.skus?.find((s) => s.id === currentSkuId);
    if (!selectedSku || selectedSku.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock.",
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
      {/* Immersive Image Gallery (Sticky) */}
      <div className="lg:col-span-7">
        <ProductImageGallery
          images={sortedImages}
          productName={product.name}
          activeImage={activeImage}
          onImageClick={handleImageClick}
          skus={product.skus || []}
          options={product.options || []}
        />
      </div>

      {/* Product Info (Scrollable) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest uppercase text-purple-600 dark:text-purple-400">
              {product.brand?.name || "Premium Brand"}
            </span>
            <div className="h-px w-8 bg-purple-600/30 dark:bg-purple-400/30"></div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              {product.category?.name || "Collection"}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter text-foreground leading-[1.1]">
              {product.name}
            </h1>
            <WishlistButton
              productId={product.id}
              initialIsWishlisted={false}
              className="mt-2"
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
              ({reviewCount} Verified Reviews)
            </span>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed border-l-2 border-emerald-500/20 pl-6">
            {product.description}
          </p>
        </motion.div>

        <div>
          <GlassCard className="p-6 md:p-8 space-y-4 backdrop-blur-xl bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5 border-emerald-500/10">
            <ProductVariantSelector
              options={product.options || []}
              skus={product.skus || []}
              isLoggedIn={isLoggedIn}
              selectedSkuId={currentSkuId}
              onSkuChange={handleSkuChange}
              onImageChange={(url) => setActiveImage(url)}
              // New Props for centralised logic
              onAddToCart={handleAddToCart}
              isAdding={isAdding}
            />

            <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-6 border-t border-white/5">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Truck className="h-5 w-5 text-primary stroke-[1.5]" />
                <span>Free Global Shipping</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="h-5 w-5 text-primary stroke-[1.5]" />
                <span>2-Year Warranty</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Check className="h-5 w-5 text-primary stroke-[1.5]" />
                <span>Authenticity Verified</span>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="pt-8 border-t border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold tracking-tight">
              Customer Reviews
            </h3>
          </div>
          <ProductReviews productId={product.id} />
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
