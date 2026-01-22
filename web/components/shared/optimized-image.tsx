"use client";

import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import { memo, useState } from "react";



interface OptimizedImageProps extends ImageProps {
  /** Ảnh thay thế nếu ảnh chính load lỗi (Mặc định: placeholder hệ thống) */
  fallbackSrc?: string;
  /** Hiệu ứng shimmer (lấp lánh) khi đang load */
  showShimmer?: boolean;
  /** Tỉ lệ khung hình (Video: 16/9, Product: 4/5) */
  aspectRatio?: "square" | "video" | "4/5" | "3/4" | "auto";
  /** ClassName cho thẻ div bao ngoài */
  containerClassName?: string;
  /** Base64 blur data URL for smooth loading */
  blurDataURL?: string;
}

// Map các tỉ lệ aspect ratio sang class của Tailwind
const aspectRatioClasses = {
  square: "aspect-square", // 1:1
  video: "aspect-video", // 16:9
  "4/5": "aspect-4/5", // Chuẩn ảnh sản phẩm thời trang
  "3/4": "aspect-3/4", // Chuẩn ảnh chân dung
  auto: "", // Tự do
};

/**
 * Component hiển thị ảnh tối ưu.
 * Sử dụng `memo` để tránh render lại không cần thiết khi parent re-render.
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/images/placeholders/product-placeholder.jpg",
  showShimmer = true,
  aspectRatio = "auto",
  containerClassName,
  className,
  blurDataURL,
  ...props
}: OptimizedImageProps) {
  // State 1: Đang tải hay xong?
  const [isLoading, setIsLoading] = useState(true);

  // State 2: Có lỗi load ảnh chính không?
  const [error, setError] = useState(false);

  // State 3: Có lỗi load ảnh fallback không?
  const [fallbackError, setFallbackError] = useState(false);

  // Kiểm tra dữ liệu src đầu vào có hợp lệ không
  // Đôi khi backend trả về chuỗi "null" hoặc "undefined" thay vì null thật
  const hasSrc =
    (src && src !== "" && src !== "null" && src !== "undefined") || false;

  // Xác định lỗi cuối cùng: Hoặc do onError kích hoạt, hoặc do src rỗng ngay từ đầu
  const finalError = error || !hasSrc;

  // QUYẾT ĐỊNH ẢNH NÀO SẼ ĐƯỢC RENDER:
  // Nếu ảnh chính lỗi -> Dùng fallback. Ngược lại dùng ảnh chính.
  const imageSrc = finalError ? fallbackSrc : src;

  // TRƯỜNG HỢP XẤU NHẤT: Cả ảnh chính và ảnh fallback đều lỗi
  if (finalError && fallbackError) {
    // Render một thẻ div màu xám thay thế
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

  // Tách các event handlers ra để wrap lại bên dưới
  const { onLoad, onError, ...rest } = props;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/30", // Nền xám nhẹ trong khi chờ
        props.fill && "w-full h-full", // Nếu fill=true thì div cha cũng phải full
        aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      {/* 
        HIỆU ỨNG SHIMMER (Skeleton loading):
        Một vệt sáng chạy qua chạy lại để báo hiệu đang tải
      */}
      {showShimmer && isLoading && (
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      )}

      {/* 
        COMPONENT NEXT/IMAGE:
        Tự động optimize size, format (webp/avif) và lazy load
      */}
      <Image
        src={imageSrc}
        alt={alt || "Image"}
        className={cn(
          "transition-all duration-700 ease-in-out", // Animation mượt mà
          isLoading
            ? "scale-110 blur-2xl opacity-0" // Khi đang load: Phóng to nhẹ, mờ, ẩn
            : "scale-100 blur-0 opacity-100", // Load xong: Rõ nét, hiện ra
          className
        )}
        placeholder={blurDataURL ? "blur" : "empty"}
        blurDataURL={blurDataURL}
        // Sự kiện: Khi load xong -> Tắt trạng thái loading
        onLoad={(e) => {
          setIsLoading(false);
          if (onLoad) onLoad(e);
        }}
        // Sự kiện: Khi load lỗi
        onError={(e) => {
          if (!finalError) {
            // Lần 1: Lỗi ảnh chính -> Thử fallback

            setError(true);
          } else {
            // Lần 2: Lỗi cả fallback -> Chấp nhận số phận

            setFallbackError(true);
          }
          // Dù lỗi cũng coi như là "load xong" quy trình để tắt shimmer
          setIsLoading(false);
          if (onError) onError(e);
        }}
        {...rest}
      />
    </div>
  );
});

/**
 * ProductImage - Phiên bản chuyên dụng cho ảnh sản phẩm
 * Luôn force tỉ lệ 4:5 để grid sản phẩm đều đẹp.
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
      aspectRatio="4/5" // Cố định tỉ lệ chuẩn thời trang
      showShimmer={true}
      className={cn("object-cover", className)}
      {...props}
    />
  );
});
