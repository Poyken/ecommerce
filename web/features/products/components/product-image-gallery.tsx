/**
 * =====================================================================
 * PRODUCT IMAGE GALLERY - Bộ sưu tập ảnh sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MAIN STAGE & THUMBNAILS:
 * - Hiển thị ảnh chính lớn và một dải ảnh nhỏ (thumbnails) bên dưới để người dùng chuyển đổi.
 * - Sử dụng `framer-motion` để tạo hiệu ứng chuyển ảnh mượt mà.
 *
 * 2. ZOOM & LIGHTBOX:
 * - Hỗ trợ zoom ảnh khi hover trên desktop.
 * - Click vào ảnh chính sẽ mở `ProductImageLightbox` để xem toàn màn hình.
 *
 * 3. SYNC WITH SKUS:
 * - Khi người dùng chọn một biến thể (màu sắc), gallery sẽ tự động chuyển đến ảnh tương ứng của biến thể đó. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { OptimizedImage } from "@/components/shared/optimized-image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { memo, useEffect, useState } from "react";

const ProductImageLightbox = dynamic(
  () =>
    import("./product-image-lightbox").then((mod) => ({
      default: mod.ProductImageLightbox,
    })),
  { ssr: false }
);

import { ProductOption, Sku } from "@/types/models";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  activeImage?: string;
  onImageClick?: (image: string) => void;
  skus?: Sku[];
  options?: ProductOption[];
  onLightboxChange?: (isOpen: boolean) => void;
}

// ... (imports)

export const ProductImageGallery = memo(function ProductImageGallery({
  images,
  productName,
  activeImage,
  onImageClick,
  skus,
  options,
  onLightboxChange,
}: ProductImageGalleryProps) {
  // ... (existing logic)
  const [, setApi] = useState<CarouselApi>();
  const [isFirstLoadReady, setIsFirstLoadReady] = useState(false);

  // ... (useEffect for carousel)

  const [displayImage, setDisplayImage] = useState(activeImage || images[0]);
  const targetImage = activeImage || images[0];
  const isTransitioning = displayImage !== targetImage;
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Preload initial image and handle state sync
  useEffect(() => {
    if (images.length > 0) {
      const img = new window.Image();
      const firstImage = activeImage || images[0];
      img.src = firstImage;
      img.onload = () => {
        setIsFirstLoadReady(true);
      };
      img.onerror = () => {
        setIsFirstLoadReady(true); // Don't block UI on error
      };

      // Also sync displayImage if it was empty or mismatched
      if (!displayImage || (displayImage !== firstImage && !isTransitioning)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplayImage(firstImage);
      }
    } else {
      setIsFirstLoadReady(true);
    }
  }, [images, activeImage, displayImage, isTransitioning]);

  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      {/* Main Image Stage */}
      <m.div
        className="relative aspect-4/5 lg:aspect-auto lg:h-[70vh] w-full rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-neutral-900/50 group backdrop-blur-sm cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onClick={() => {
          setIsLightboxOpen(true);
          onLightboxChange?.(true);
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Initial Loading Skeleton */}
        <AnimatePresence>
          {!isFirstLoadReady && (
            <m.div
              key="skeleton"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-50"
            >
              <Skeleton className="w-full h-full" />
            </m.div>
          )}
        </AnimatePresence>

        {/* 1. The Stable Display Image (Always Visible) */}
        <m.div
          initial={{ opacity: 0, filter: "blur(20px)" }}
          animate={{
            opacity: isFirstLoadReady ? 1 : 0,
            filter: isFirstLoadReady ? "blur(0px)" : "blur(20px)",
          }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          <OptimizedImage
            src={displayImage}
            alt={productName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={cn(
              "object-cover transition-transform duration-700 ease-out-expo",
              isZoomed ? "scale-110" : "scale-100",
              "z-10"
            )}
            priority
          />
        </m.div>

        {/* 2. The Incoming Image (Loading in Background) */}
        {isTransitioning && (
          <OptimizedImage
            key={targetImage} // Force new instance for reliable Load event
            src={targetImage}
            alt={productName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={cn(
              "object-cover transition-transform duration-700 ease-out-expo absolute top-0 left-0",
              isZoomed ? "scale-110" : "scale-100",
              "opacity-0 z-20" // Hidden until loaded
            )}
            priority
            onLoad={() => {
              // Image is ready! Promote it to displayImage.
              setDisplayImage(targetImage);
            }}
          />
        )}

        {/* Floating zoom hint */}
        <div className="absolute top-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30">
          <div className="bg-black/40 backdrop-blur-md text-white/90 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
            Zoom Ready
          </div>
        </div>
      </m.div>

      {/* Thumbnails Carousel */}
      <div className="relative w-full">
        <Carousel
          opts={{
            align: "center",
            loop: true,
          }}
          className="w-full"
          setApi={setApi}
        >
          <CarouselContent className="-ml-4">
            {images.map((img, i) => (
              <CarouselItem key={i} className="pl-4 basis-1/4 lg:basis-1/5">
                <button
                  onClick={() => {
                    if (onImageClick) onImageClick(img);
                  }}
                  className={cn(
                    "relative aspect-square w-full rounded-xl overflow-hidden border transition-all duration-300",
                    targetImage === img
                      ? "border-primary ring-2 ring-primary/20 scale-95 opacity-100 shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                      : "border-white/10 opacity-70 hover:opacity-100 hover:border-primary/50 hover:scale-105"
                  )}
                >
                  <OptimizedImage
                    src={img}
                    alt={`${productName} thumbnail ${i + 1}`}
                    fill
                    sizes="100px"
                    className="object-cover"
                  />
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-2 bg-black/50 backdrop-blur-md border-white/10 hover:bg-black/80 hover:border-primary/50 text-white" />
          <CarouselNext className="right-2 bg-black/50 backdrop-blur-md border-white/10 hover:bg-black/80 hover:border-primary/50 text-white" />
        </Carousel>
      </div>

      <ProductImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => {
          setIsLightboxOpen(false);
          onLightboxChange?.(false);
        }}
        images={images}
        activeImage={activeImage || images[0]}
        onImageChange={(img) => onImageClick?.(img)}
        skus={skus}
        options={options}
      />
    </div>
  );
});
