"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface UserAvatarProps {
  src?: string | null;
  alt?: string | null;
  fallback?: string;
  className?: string;
}

/**
 * =====================================================================
 * USER AVATAR - Standardized Avatar Component
 * =====================================================================
 * 
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FALLBACK STRATEGY:
 * - Ưu tiên hiển thị ảnh (src).
 * - Nếu không có ảnh hoặc lỗi tải -> Hiển thị Fallback (Initials: "AB").
 * - Wrapper `validSrc` check kỹ các trường hợp "null" string do API trả về.
 *
 * 2. MEMOIZATION:
 * - `memo` giúp tránh render lại không cần thiết khi parent re-render,
 *   vì Avatar thường nằm trong Header/List item tĩnh. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */
export const UserAvatar = memo(function UserAvatar({
  src,
  alt = "User",
  fallback,
  className,
}: UserAvatarProps) {
  // Generate initials for fallback if no specific fallback provided
  const initials = fallback || (alt?.charAt(0).toUpperCase() || "U");
  
  // Clean src - sometimes backend returns "null" string
  const validSrc = (src && src !== "null" && src !== "undefined") ? src : undefined;

  // DiceBear fallback URL as a secondary backup if AvatarImage fails to load
  // (Note: Shadcn AvatarImage handles error state internally, falling back to AvatarFallback. 
  // But if we want a fancy avatar instead of letters, we use DiceBear in the Fallback or handle it here)
  
  return (
    <Avatar className={cn("bg-muted border border-border/10", className)}>
      <AvatarImage 
        src={validSrc} 
        alt={alt || "User Avatar"} 
        className="object-cover"
      />
      <AvatarFallback className="font-bold text-primary bg-primary/10">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
});
