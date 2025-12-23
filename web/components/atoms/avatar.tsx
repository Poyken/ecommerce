"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * AVATAR - Thành phần hiển thị ảnh đại diện
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FALLBACK STRATEGY:
 * - Khi ảnh bị lỗi hoặc chưa load xong, `AvatarFallback` sẽ được hiển thị.
 * - Thường dùng để hiển thị chữ cái đầu của tên user (VD: "John Doe" -> "JD").
 *
 * 2. RADIX PRIMITIVE:
 * - Sử dụng `@radix-ui/react-avatar` để xử lý việc chuyển đổi giữa ảnh và fallback một cách mượt mà, không bị giật (flicker).
 *
 * 3. STYLING:
 * - `aspect-square`: Luôn đảm bảo ảnh là hình vuông.
 * - `rounded-full`: Cắt ảnh thành hình tròn.
 * =====================================================================
 */

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
