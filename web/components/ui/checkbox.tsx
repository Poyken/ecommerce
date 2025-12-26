"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * CHECKBOX - Ô đánh dấu (Tick box)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STATE-DRIVEN STYLING:
 * - Sử dụng `data-[state=checked]` để thay đổi màu nền và viền khi checkbox được chọn.
 * - Đây là cách Radix UI quản lý trạng thái mà không cần bạn phải viết logic `if (checked)`.
 *
 * 2. INDICATOR:
 * - `CheckboxPrimitive.Indicator`: Chỉ hiển thị icon `CheckIcon` khi trạng thái là `checked`.
 * - Giúp tạo hiệu ứng xuất hiện/biến mất mượt mà.
 *
 * 3. ACCESSIBILITY:
 * - `peer`: Cho phép các element khác (như Label) thay đổi style dựa trên trạng thái của checkbox này.
 * - Hỗ trợ đầy đủ phím `Space` để chọn và `Tab` để điều hướng.
 * =====================================================================
 */

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
