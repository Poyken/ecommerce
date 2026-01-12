"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * SEPARATOR - Đường kẻ phân cách nội dung
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DECORATIVE VS SEMANTIC:
 * - `decorative={true}`: Google và trình đọc màn hình sẽ bỏ qua nó (chỉ dùng để trang trí).
 * - `decorative={false}`: Có ý nghĩa phân tách các vùng nội dung khác nhau (Semantic).
 *
 * 2. ORIENTATION:
 * - Hỗ trợ cả `horizontal` (ngang) và `vertical` (dọc).
 * - Sử dụng `data-[orientation]` attributes để áp dụng CSS tương ứng một cách linh hoạt.
 *
 * 3. STYLING:
 * - `shrink-0`: Đảm bảo đường kẻ không bị co lại khi nằm trong Flexbox. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  );
}

export { Separator };
