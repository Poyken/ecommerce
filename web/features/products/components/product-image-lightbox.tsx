"use client";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { X, ZoomIn } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

import { OptionValue, ProductOption, Sku } from "@/types/models";

interface ProductImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  activeImage: string;
  onImageChange: (image: string) => void;
  skus?: Sku[];
  options?: ProductOption[];
}

export function ProductImageLightbox({
  isOpen,
  onClose,
  images,
  activeImage,
  onImageChange,
  skus,
  options,
}: ProductImageLightboxProps) {
  /**
   * =====================================================================
   * PRODUCT IMAGE LIGHTBOX - Xem ảnh phóng to
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. TRANSFORM WRAPPER (Zoom/Pan):
   * - Sử dụng thư viện `react-zoom-pan-pinch`.
   * - Cho phép user dùng chuột (scroll) hoặc ngón tay (pinch) để zoom ảnh.
   *
   * 2. SYNC LOGIC:
   * - Khi slide carousel thay đổi -> Cập nhật `activeImage` state ở component cha.
   * - Khi user chọn thumbnail -> Scroll carousel tới slide tương ứng.
   * =====================================================================
   */
  // ... (keeping existing comments and hooks)
  const t = useTranslations("product");
  const [api, setApi] = useState<CarouselApi>();
  const [mounted, setMounted] = useState(false);
  const [current, setCurrent] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const lastClickTime = useRef<number>(0);

  const zoomRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Sync Carousel with Active Image
  useEffect(() => {
    if (!api || !isOpen) return;
    const index = images.indexOf(activeImage);
    if (index !== -1 && api.selectedScrollSnap() !== index) {
      api.scrollTo(index, true);
    }
  }, [api, activeImage, images, isOpen]);

  // Sync Active Image with Carousel Slide
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const index = api.selectedScrollSnap();
      setCurrent(index + 1);
      const newImage = images[index];
      if (newImage !== activeImage) {
        onImageChange(newImage);
        // Reset zoom on slide change
        if (zoomRef.current) {
          zoomRef.current.resetTransform();
        }
      }
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, images, activeImage, onImageChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") api?.scrollPrev();
      if (e.key === "ArrowRight") api?.scrollNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, api]);

  // Track zoom state to disable Carousel drag
  // Track zoom state to disable Carousel drag
  const onTransformed = (ref: any) => {
    setIsZoomed(ref.instance.transformState.scale > 1);
  };

  // Find current SKU details
  const currentSku = skus?.find((s) => s.imageUrl === activeImage);
  const skuDetails = currentSku?.optionValues
    ?.map((ov: any) => {
      const option = options?.find((o) => o.id === ov.optionValue.optionId);
      const value = option?.values.find(
        (v: OptionValue) => v.id === ov.optionValueId
      );
      return option && value ? `${option.name}: ${value.value}` : null;
    })
    .filter(Boolean)
    .join(" | ");

  if (!mounted || typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto"
          onClick={(e) => {
            // Only close if clicking directly on the overlay (not on content)
            if (e.target === e.currentTarget) {
              e.stopPropagation();
              onClose();
            }
          }}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10000 text-white/70 hover:text-white hover:bg-white/10 rounded-full h-12 w-12 pointer-events-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Carousel */}
          <div
            className="w-full h-full flex items-center justify-center p-4 md:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <Carousel
              setApi={setApi}
              className="w-full h-full max-w-7xl mx-auto **:data-[slot=carousel-content]:h-full"
              opts={{
                loop: true,
                align: "center",
                watchDrag: !isZoomed, // Disable drag when zoomed to allow panning
              }}
            >
              <CarouselContent className="h-full">
                {images.map((img, index) => (
                  <CarouselItem
                    key={index}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    <div
                      className="w-full h-full flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TransformWrapper
                        ref={(ref) => {
                          if (index === images.indexOf(activeImage)) {
                            zoomRef.current = ref;
                          }
                        }}
                        initialScale={1}
                        minScale={1}
                        maxScale={8}
                        wheel={{ step: 0.2 }}
                        doubleClick={{ disabled: true }}
                        onTransformed={onTransformed}
                      >
                        {({ zoomIn, resetTransform, ...rest }) => {
                          const handleClick = (e: React.MouseEvent) => {
                            e.stopPropagation();

                            const now = Date.now();
                            const DOUBLE_CLICK_TIME = 350;

                            if (
                              now - lastClickTime.current <
                              DOUBLE_CLICK_TIME
                            ) {
                              // Double click detected
                              const scale = rest.instance.transformState.scale;
                              if (scale >= 3.9) {
                                // If at 4x or higher, reset to 1x
                                resetTransform(300);
                              } else if (scale >= 1.9) {
                                // If at 2x, zoom to 4x
                                zoomIn(2, 300);
                              } else {
                                // If at 1x, zoom to 2x
                                zoomIn(2, 300);
                              }
                            }
                            lastClickTime.current = now;
                          };

                          const currentScale =
                            rest.instance.transformState.scale;

                          return (
                            <TransformComponent
                              wrapperStyle={{ width: "100%", height: "100%" }}
                              contentStyle={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <div
                                className={cn(
                                  "relative w-full h-full flex items-center justify-center",
                                  currentScale > 1
                                    ? "cursor-grab active:cursor-grabbing"
                                    : "cursor-zoom-in"
                                )}
                                onClick={handleClick}
                              >
                                <Image
                                  src={img}
                                  alt={`Product image ${index + 1}`}
                                  fill
                                  className="object-contain"
                                  priority={
                                    index === images.indexOf(activeImage)
                                  }
                                  unoptimized
                                  sizes="100vw"
                                />
                              </div>
                            </TransformComponent>
                          );
                        }}
                      </TransformWrapper>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Navigation Buttons */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
                <CarouselPrevious className="pointer-events-auto relative left-0 translate-y-0 h-12 w-12 border-white/10 bg-black/50 text-white hover:bg-black/80 hover:text-white" />
                <CarouselNext className="pointer-events-auto relative right-0 translate-y-0 h-12 w-12 border-white/10 bg-black/50 text-white hover:bg-black/80 hover:text-white" />
              </div>
            </Carousel>
          </div>

          {/* SKU Details & Zoom Hint */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-none w-full px-4 z-50">
            {skuDetails && (
              <div className="bg-black/60 backdrop-blur px-6 py-3 rounded-full text-white font-medium border border-white/10 shadow-lg text-center">
                {skuDetails}
              </div>
            )}

            <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-full text-white/70 text-xs font-medium flex items-center gap-2 border border-white/10">
              <ZoomIn className="h-3 w-3" />
              <span>{t("zoomHint")}</span>
            </div>
          </div>

          {/* Thumbnails Strip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[90vw] overflow-x-auto flex gap-2 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 no-scrollbar z-50">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => api?.scrollTo(idx)}
                className={cn(
                  "relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                  idx === current - 1
                    ? "border-primary opacity-100 scale-110"
                    : "border-transparent opacity-50 hover:opacity-100 hover:scale-105"
                )}
              >
                <Image
                  src={img}
                  fill
                  className="object-cover"
                  alt={`thumb-${idx}`}
                  sizes="48px"
                />
              </button>
            ))}
          </div>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-white/90 text-xs font-medium border border-white/10 z-50">
            {current} / {images.length}
          </div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
