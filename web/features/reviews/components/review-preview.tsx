"use client";

import { Star } from "lucide-react";
import Image from "next/image";

/**
 * =====================================================================
 * REVIEW PREVIEW - Hiển thị đánh giá và bằng chứng xã hội
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SOCIAL PROOF (Bằng chứng xã hội):
 * - Rating và Review là yếu tố then chốt để tăng tỷ lệ chuyển đổi (Conversion Rate).
 * - Hiển thị tên và ảnh của người review thật giúp tăng độ tin cậy.
 *
 * 2. STAR RENDERING LOGIC:
 * - `fullStars`: Số lượng sao vàng nguyên vẹn.
 * - `hasHalfStar`: Kiểm tra nếu phần dư >= 0.5 để hiển thị nửa ngôi sao.
 * - Kỹ thuật hiển thị nửa sao: Sử dụng `relative` container và `overflow-hidden` trên một layer sao vàng đè lên sao xám.
 *
 * 3. UI OPTIMIZATION:
 * - `line-clamp-2`: Giới hạn nội dung review tối đa 2 dòng để không làm vỡ layout của Product Card.
 * - `CompactRating`: Một phiên bản rút gọn dùng cho các không gian hẹp. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */
interface ReviewPreviewProps {
  rating: number;
  reviewCount: number;
  previewText?: string;
  reviewerName?: string;
  reviewerImage?: string;
  className?: string;
}

export function ReviewPreview({
  rating,
  reviewCount,
  previewText,
  reviewerName,
  reviewerImage,
  className,
}: ReviewPreviewProps) {
  // Render stars
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-3.5 h-3.5 text-muted-foreground/30" />
        );
      }
    }
    return stars;
  };

  return (
    <div className={className}>
      {/* Rating Summary */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">{renderStars()}</div>
        <span className="text-sm font-medium text-foreground">
          {rating.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground">({reviewCount})</span>
      </div>

      {/* Review Preview */}
      {previewText && (
        <div className="mt-2 p-2.5 bg-muted/30 rounded-lg border border-white/5">
          <p className="text-xs text-muted-foreground line-clamp-2 italic">
            &quot;{previewText}&quot;
          </p>
          {reviewerName && (
            <div className="flex items-center gap-2 mt-2">
              {reviewerImage ? (
                <Image
                  src={reviewerImage}
                  alt={reviewerName}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                  {reviewerName.charAt(0)}
                </div>
              )}
              <span className="text-[10px] text-muted-foreground font-medium">
                {reviewerName}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * CompactRating - Phiên bản nhỏ gọn chỉ hiển thị stars và số
 */
export function CompactRating({
  rating,
  reviewCount,
  className,
}: {
  rating: number;
  reviewCount: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      <span className="text-xs font-medium text-foreground">
        {rating.toFixed(1)}
      </span>
      <span className="text-xs text-muted-foreground">({reviewCount})</span>
    </div>
  );
}
