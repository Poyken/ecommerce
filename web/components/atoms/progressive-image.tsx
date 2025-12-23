"use client";

import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import { useCallback, useState } from "react";

/**
 * =====================================================================
 * PROGRESSIVE IMAGE - Image với loading state mượt mà
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SHIMMER OVERLAY:
 * - Shimmer placeholder sẽ ĐÈ LÊN ảnh trong khi loading.
 * - Hiệu ứng ánh sáng chạy ngang tạo cảm giác đang load.
 * - Khi ảnh load xong → shimmer fade đi → ảnh hiện ra.
 *
 * 2. img.decode() API:
 * - Đợi browser decode hoàn tất ảnh trước khi hiển thị.
 * - Đây là cách đáng tin cậy nhất.
 *
 * 3. Z-Index:
 * - Overlay có z-index cao hơn để che ảnh đang load.
 * =====================================================================
 */

interface ProgressiveImageProps
  extends Omit<ImageProps, "onLoad" | "onLoadingComplete"> {
  skeletonClassName?: string;
  wrapperClassName?: string;
}

export function ProgressiveImage({
  className,
  skeletonClassName,
  wrapperClassName,
  alt,
  ...props
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;

      // Use decode() API to ensure image is fully decoded before showing
      if (img.decode) {
        img
          .decode()
          .then(() => setIsLoaded(true))
          .catch(() => setIsLoaded(true));
      } else {
        if (img.complete && img.naturalHeight !== 0) {
          setIsLoaded(true);
        }
      }
    },
    []
  );

  return (
    <div className={cn("relative overflow-hidden w-full", wrapperClassName)}>
      {/* Main image - loads in background */}
      <Image
        {...props}
        alt={alt}
        className={cn(className)}
        onLoad={handleLoad}
      />

      {/* Shimmer overlay - fades out when image loads */}
      <div
        className={cn(
          "absolute inset-0 z-10 bg-muted transition-opacity duration-500",
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100",
          skeletonClassName
        )}
      >
        {/* Shimmer effect */}
        <div
          className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent"
          style={{
            animation: isLoaded ? "none" : "shimmer 1.5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
