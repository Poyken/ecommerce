"use client";

import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import { memo, useState } from "react";

/**
 * =====================================================================
 * OPTIMIZED IMAGE - Component ảnh với blur placeholder
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BLUR PLACEHOLDER:
 * - Hiển thị một version mờ của ảnh trong khi ảnh thật đang load.
 * - Tạo cảm giác load nhanh hơn (perceived performance).
 *
 * 2. LOADING STATE:
 * - Track khi ảnh đã load xong để remove blur effect.
 * - Fade transition smooth từ blur -> clear.
 *
 * 3. ERROR HANDLING:
 * - Fallback image nếu load thất bại.
 * =====================================================================
 */

interface OptimizedImageProps extends ImageProps {
  /** Fallback image URL nếu load thất bại */
  fallbackSrc?: string;
  /** Show shimmer loading effect */
  showShimmer?: boolean;
  /** Aspect ratio cho container */
  aspectRatio?: "square" | "video" | "4/5" | "3/4" | "auto";
  /** Container className */
  containerClassName?: string;
}

const aspectRatioClasses = {
  square: "aspect-square",
  video: "aspect-video",
  "4/5": "aspect-4/5",
  "3/4": "aspect-3/4",
  auto: "",
};

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/images/placeholders/product-placeholder.jpg",
  showShimmer = true,
  aspectRatio = "auto",
  containerClassName,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  // If source is empty, treat as error immediately
  const hasSrc =
    (src && src !== "" && src !== "null" && src !== "undefined") || false;
  const finalError = error || !hasSrc;

  // Choose which source to use
  let imageSrc = finalError ? fallbackSrc : src;
  if (finalError && fallbackError) {
    // If BOTH primary and fallback fail, we'll render a placeholder div instead of a broken Image
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-muted/30 flex items-center justify-center p-4 text-center",
          aspectRatioClasses[aspectRatio],
          containerClassName
        )}
      >
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
          {alt || "Image Not Found"}
        </span>
      </div>
    );
  }

  const { onLoad, onError, ...rest } = props;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/30",
        props.fill && "w-full h-full",
        aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      {/* Shimmer loading effect */}
      {showShimmer && isLoading && (
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      )}

      <Image
        src={imageSrc}
        alt={alt || "Image"}
        className={cn(
          "transition-all duration-700 ease-in-out",
          isLoading
            ? "scale-110 blur-2xl opacity-0"
            : "scale-100 blur-0 opacity-100",
          className
        )}
        onLoad={(e) => {
          setIsLoading(false);
          if (onLoad) onLoad(e);
        }}
        onError={(e) => {
          if (!finalError) {
            setError(true);
          } else {
            setFallbackError(true);
          }
          setIsLoading(false);
          if (onError) onError(e);
        }}
        {...rest}
      />
    </div>
  );
});

/**
 * ProductImage - Specialized version cho product images
 */
export const ProductImage = memo(function ProductImage({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, "aspectRatio" | "showShimmer">) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio="4/5"
      showShimmer={true}
      className={cn("object-cover", className)}
      {...props}
    />
  );
});

/**
 * AvatarImage - Specialized version cho user avatars
 */
export const AvatarImage = memo(function AvatarImage({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [error, setError] = useState(false);

  // Generate dicebear avatar as fallback
  const fallbackSrc = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    alt
  )}`;

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-muted",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
});
