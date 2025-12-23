import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * TEXTAREA - Thành phần nhập liệu văn bản nhiều dòng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FORWARD REF:
 * - Cho phép component cha truy cập trực tiếp vào thẻ `textarea` bên dưới (VD: để focus hoặc đo kích thước).
 *
 * 2. STYLING:
 * - `min-h-[80px]`: Đảm bảo chiều cao tối thiểu để user nhận diện đây là ô nhập liệu dài.
 * - `focus-visible`: Chỉ hiển thị viền focus khi user tương tác bằng bàn phím (Accessibility).
 *
 * 3. FLEXIBILITY:
 * - Kế thừa toàn bộ `React.TextareaHTMLAttributes`, giúp nó hoạt động giống hệt thẻ `textarea` chuẩn của HTML.
 * =====================================================================
 */

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
