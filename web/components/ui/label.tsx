"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * LABEL - Nhãn cho các ô nhập liệu (Form Label)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ACCESSIBILITY (A11y):
 * - Sử dụng `@radix-ui/react-label` để đảm bảo khi click vào label, ô input tương ứng sẽ được focus.
 * - Giúp tăng diện tích tương tác, đặc biệt hữu ích trên thiết bị di động.
 *
 * 2. PEER SELECTOR:
 * - `peer-disabled`: Kỹ thuật CSS của Tailwind để thay đổi style của label khi ô input "hàng xóm" (`peer`) bị disable.
 *
 * 3. USER EXPERIENCE:
 * - `select-none`: Ngăn chặn việc bôi đen văn bản label khi user click nhanh nhiều lần. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Label };
