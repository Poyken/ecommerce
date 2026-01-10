"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  VisuallyHidden,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/features/cart/hooks/use-cart";
import { ProductImageGallery } from "@/features/products/components/product-image-gallery";
import { ProductVariantSelector } from "@/features/products/components/product-variant-selector";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { Link } from "@/i18n/routing";
import { cn, formatCurrency } from "@/lib/utils";
import { productService } from "@/services/product.service";
import { Product, Sku } from "@/types/models";
import { Shield, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface ProductQuickViewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  initialSkuId?: string;
  initialData?: {
    name: string;
    price: number;
    imageUrl: string;
    category?: string;
  };
}

/**
 * =====================================================================
 * PRODUCT QUICK VIEW DIALOG - Xem nhanh sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC DATA FETCHING:
 * - Dialog nhận `productId` và tự gọi API `getProduct` khi mở ra.
 * - Tại sao không truyền full object từ ngoài vào? -> Để đảm bảo dữ liệu luôn mới nhất (tồn kho, giá) mà không cần reload trang cha.
 *
 * 2. SKELETON LOADING (UI Loading):
 * - Trong khi chờ API, hiển thị khung xương (`Skeleton`) thay vì để trắng trơn.
 * - Logic `if (loading && !product)`: Chỉ hiện Skeleton nếu chưa có data cũ.
 *
 * 3. SMART IMAGE SORTING (`useMemo`):
 * - Logic phức tạp để sắp xếp ảnh: Ảnh của tùy chọn chính (VD: Màu sắc) lên đầu, tiếp theo là các ảnh chung.
 * - Giúp user thấy đúng ảnh màu áo mình đang chọn ngay lập tức.
 * =====================================================================
 */
export function ProductQuickViewDialog({
  isOpen,
  onOpenChange,
  productId,
  initialSkuId,
  initialData,
}: ProductQuickViewDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState<string | undefined>(undefined);
  const [currentSkuId, setCurrentSkuId] = useState<string | undefined>(
    initialSkuId
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Sync initialSkuId when it changes or dialog opens
  // Sync initialSkuId when it changes or dialog opens
  useEffect(() => {
    if (isOpen && initialSkuId) {
      setTimeout(() => {
        setCurrentSkuId(initialSkuId);
      }, 0);
    }
  }, [isOpen, initialSkuId]);

  // No manual scroll lock here - controlled by Radix UI Dialog

  // Fetch product details
  // Fetch product details
  useEffect(() => {
    if (!isOpen || !productId) return;

    let isMounted = true;

    // Reset product if it doesn't match current ID
    // This prevents showing old data while loading
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProduct((prev) => (prev?.id === productId ? prev : null));
    setLoading(true);

    productService
      .getProduct(productId)
      .then((data) => {
        if (!isMounted) return;

        // Validate data has an ID (fixes issue with http.ts returning [] on error)
        if (data && data.id) {
          setProduct(data);
          const defaultImg =
            data.skus?.[0]?.imageUrl ||
            (typeof data.images?.[0] === "string"
              ? data.images[0]
              : data.images?.[0]?.url);
          if (defaultImg) setActiveImage(defaultImg);
        } else {
          // Handle case where API returns invalid data/fallback
          // Only close if genuinely failed? Or just keep loading false?
          // Preventing infinite loop: don't call setProduct if invalid
          console.warn("Invalid product data received", data);
          // Optional: onOpenChange(false) if strict
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to fetch product", err);
        toast({
          title: "Error",
          description: "Failed to load product details.",
          variant: "destructive",
        });
        onOpenChange(false);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, productId, onOpenChange, toast]); // Removed 'product' from dependency array

  const { addToCart, isAdding } = useCart(
    product?.name || initialData?.name || ""
  );

  // Calculate Sorted Images (reused logic)
  const sortedImages = useMemo(() => {
    if (!product) return initialData?.imageUrl ? [initialData.imageUrl] : [];

    const initialImages = (product.images || []).map((img) =>
      typeof img === "string" ? img : img.url
    );
    const skuImages =
      (product.skus?.map((s) => s.imageUrl).filter(Boolean) as string[]) || [];
    const allImages = Array.from(new Set([...initialImages, ...skuImages]));

    if (!product.options || product.options.length === 0) return allImages;

    const primaryOption = product.options[0];
    const orderedImages: string[] = [];
    const seenImages = new Set<string>();

    primaryOption.values.forEach((val) => {
      const sku = product.skus?.find((s) =>
        s.optionValues?.some((ov) => ov.optionValue.id === val.id)
      );
      if (sku && sku.imageUrl && !seenImages.has(sku.imageUrl)) {
        orderedImages.push(sku.imageUrl);
        seenImages.add(sku.imageUrl);
      }
    });

    allImages.forEach((img) => {
      if (!seenImages.has(img)) {
        orderedImages.push(img);
        seenImages.add(img);
      }
    });

    return orderedImages.length > 0 ? orderedImages : allImages;
  }, [product, initialData]);

  const handleSkuChange = (sku: Sku | null) => {
    if (sku) {
      if (sku.imageUrl) setActiveImage(sku.imageUrl);
      setCurrentSkuId(sku.id);
    }
  };

  // Sync SKU selection when clicking on an image in the gallery
  const handleImageClick = (imageUrl: string) => {
    setActiveImage(imageUrl);

    // Find SKU with this image and update selection
    const targetSku = product?.skus?.find((sku) => sku.imageUrl === imageUrl);
    if (targetSku) {
      setCurrentSkuId(targetSku.id);
    }
  };

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

    const selectedSku = product?.skus?.find((s) => s.id === currentSkuId);
    if (!selectedSku || selectedSku.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    await addToCart(currentSkuId, 1);
    // Do NOT close dialog on regular add to cart (User request)
  };

  // Render Skeleton if loading
  if (loading && !product) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange} modal={true}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-white/10">
          <VisuallyHidden>
            <DialogTitle>
              {initialData?.name || "Loading product details..."}
            </DialogTitle>
          </VisuallyHidden>
          <div className="grid grid-cols-1 md:grid-cols-2 h-[600px]">
            <Skeleton className="h-full w-full rounded-none" />
            <div className="p-8 space-y-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} modal={true}>
      <DialogContent
        className={cn(
          "max-w-7xl! p-0 bg-background/95 backdrop-blur-xl border-white/10 sm:rounded-3xl overflow-hidden",
          isLightboxOpen && "pointer-events-none"
        )}
        onInteractOutside={(e) => {
          // Prevent Dialog from closing when Lightbox is open
          if (isLightboxOpen) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Prevent Dialog from closing when Lightbox is open
          if (isLightboxOpen) {
            e.preventDefault();
          }
        }}
      >
        <VisuallyHidden>
          <DialogTitle>{product?.name || initialData?.name}</DialogTitle>
        </VisuallyHidden>
        <div className="overflow-y-auto max-h-[90vh] no-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-start">
            {/* Gallery - 7 cols on large, full on small */}
            <div className="lg:col-span-7 bg-neutral-50 dark:bg-neutral-900/50 p-6 lg:p-8">
              {product && (
                <ProductImageGallery
                  images={sortedImages}
                  productName={product.name}
                  activeImage={activeImage}
                  onImageClick={handleImageClick}
                  skus={product.skus || []}
                  options={product.options || []}
                  onLightboxChange={setIsLightboxOpen}
                />
              )}
            </div>

            {/* Info - 5 cols */}
            <div className="lg:col-span-5 p-6 lg:p-10 flex flex-col gap-6">
              {product ? (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold tracking-widest uppercase text-purple-600 dark:text-purple-400">
                        {product.brand?.name || "Premium Brand"}
                      </span>
                      <div className="h-px w-8 bg-purple-600/30 dark:bg-purple-400/30"></div>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        {product.category?.name || "Collection"}
                      </span>
                    </div>

                    <div className="flex justify-between items-start gap-4">
                      <Link
                        href={`/products/${product.id}`}
                        className="hover:underline hover:text-primary transition-colors"
                      >
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-foreground leading-[1.1]">
                          {product.name}
                        </h2>
                      </Link>
                      <WishlistButton
                        productId={product.id}
                        initialIsWishlisted={false}
                        className="text-foreground shrink-0"
                      />
                    </div>

                    {/* Short Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {product.description}
                    </p>

                    <Link
                      href={`/products/${product.id}`}
                      className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
                    >
                      View Full Details
                    </Link>
                  </div>

                  {/* Variant Selector & Add to Cart */}
                  <GlassCard className="p-5 space-y-4 backdrop-blur-xl bg-linear-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5 border-emerald-500/10">
                    <ProductVariantSelector
                      options={product.options || []}
                      skus={product.skus || []}
                      selectedSkuId={currentSkuId}
                      onSkuChange={handleSkuChange}
                      onImageChange={setActiveImage}
                      onAddToCart={handleAddToCart}
                      onBuyNow={async () => {
                        if (!currentSkuId) return;
                        await addToCart(currentSkuId, 1);
                        onOpenChange(false);
                        router.push("/cart");
                      }}
                      isAdding={isAdding}
                    />
                  </GlassCard>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Truck className="h-4 w-4 text-primary stroke-[1.5]" />
                      <span>Free Global Shipping</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="h-4 w-4 text-primary stroke-[1.5]" />
                      <span>2-Year Warranty</span>
                    </div>
                  </div>
                </>
              ) : (
                // Fallback using initial data if product load fails or delay
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">{initialData?.name}</h2>
                  <p className="text-xl font-bold">
                    {initialData?.price
                      ? formatCurrency(initialData.price)
                      : "..."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
